/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  An Example Plugin
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
    Espruino.Core.Config.add("LOCAL_MODULE_DIR", {
      section : "Communications",
      name : "Local Module directory",
      description : "Which local directory are modules stored in? Can be blank if there is no directory.",
      type : "string",
      defaultValue : ""
    });
    
    Espruino.addProcessor("getModule", function (data, callback) {
      if (Espruino.Config.LOCAL_MODULE_DIR!="") { // Set this up in Settings
        // ...
        console.log("Local Module search for "+data.moduleName);
        
        if (data.moduleName == "foo") {
          // if the module is handled... 
          setTimeout(function() {
            // load data (setTimeout simulates possible delay?)
            data.moduleCode = "exports.foo = 'Foo';";
            callback(data);
          }, 10);
        } else
          callback(data);
        
      } else
        callback(data);
    });
  }
  
  Espruino.Plugins.LocalModules = {
    init : init,
  };
}());