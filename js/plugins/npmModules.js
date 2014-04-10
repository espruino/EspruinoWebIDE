/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Try and get modules from npm
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
    Espruino.Core.Config.add("NPM_MODULES", {
      section : "Communications",
      name : "Load modules from NPM (BETA)",
      description : "If a module isn't found, try and load it from the NPM (Node.js) registry",
      type : "boolean",
      defaultValue : false
    });
    
    Espruino.addProcessor("getModule", function (data, callback) {
      if (Espruino.Config.NPM_MODULES && 
          data.moduleCode===undefined && // not already loaded
          /^[A-Za-z0-9-]+$/.test(data.moduleName) // not some fancy name
          ) {
        var url = "http://registry.npmjs.org/"+data.moduleName;
        console.log("NPM: Checking NPM at "+url);
        $.get(url, function (json) {
          var ok = false;
          if (json["dist-tags"] && json["dist-tags"]["latest"]) {
            var version = json["dist-tags"]["latest"];
            console.log("NPM: Latest version "+version);
            if (json["versions"] && json["versions"][version] && 
                json["versions"][version]["dist"] && 
                json["versions"][version]["dist"]["tarball"] &&
                json["versions"][version]["main"]) {
              var tarUrl = json["versions"][version]["dist"]["tarball"];
              var entryPoint = json["versions"][version]["main"];
              console.log("NPM: URL "+tarUrl);
              ok = true;
              TarGZ.load(tarUrl, function onload(files) {
                console.log(files);
                for (var i in files) {
                  var file = files[i];
                  if (file["data"] && file["filename"].indexOf(entryPoint)>=0) {
                    console.log("NPM: Using "+file["filename"]+" as the entrypoint");
                    data.moduleCode = file.data;              
                    // TODO:  minification?
                  }
                }
                callback(data);
              }, function onstream() {
              }, function onerror() {
                console.log("NPM: TarGZ load failed");
                callback(data);
              });
            }
          }
          if (!ok) {
            console.log("NPM: couldn't find latest tarball");
            console.log(json);
            callback(data);
          }
        }, "json").fail(function () {
          // Failed :(
          callback(data);
        });
        
      } else
        callback(data);
    });
  }
  
  Espruino.Plugins.NPMModules = {
    init : init,
  };
}());