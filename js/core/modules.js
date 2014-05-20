/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Automatically load any referenced modules
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
    Espruino.Core.Config.add("MODULE_URL", {
      section : "Communications",
      name : "Module URL",
      description : "Where to search online for modules when `require()` is used",
      type : "string",
      defaultValue : "http://www.espruino.com/modules"
    });
    Espruino.Core.Config.add("MODULE_EXTENSIONS", {
      section : "Communications",
      name : "Module Extensions",
      description : "The file extensions to use for each module. These are checked in order and the first that exists is used. One or more file extensions (including the dot) separated by `|`",
      type : "string",
      defaultValue : ".min.js|.js"
    });    
    
    // When code is sent to Espruino, search it for modules and add extra code required to load them 
    Espruino.addProcessor("transformForEspruino", function(code, callback) {
      loadModules(code, callback);
    });
  }

  // TODO: use Espruino.Core.Env.getData().info.builtin_modules
  var BUILT_IN_MODULES = ["http","fs","CC3000","WIZnet"]; // TODO: get these from board.js (hopefully)

  /** Find any instances of require(...) in the code string and return a list */
  var getModulesRequired = function(code) {
    var modules = [];
    
    var lex = Espruino.Core.Utils.getLexer(code);
    var tok = lex.next();
    var state = 0;
    while (tok!==undefined) {
      if (state==0 && tok.str=="require") {
        state=1;
      } else if (state==1 && tok.str=="(") {
        state=2;
      } else if (state==2 && (tok.type=="STRING")) {
        state=0;
        var module = tok.value;
        if (BUILT_IN_MODULES.indexOf(module)<0 && modules.indexOf(module)<0)
          modules.push(module);
      } else
        state = 0;
      tok = lex.next();
    }
        
    return modules;
  };
  
  /** Called from loadModule when a module is loaded. Parse it for other modules it might use
   *  and resolve dfd after all submodules have been loaded */
  function moduleLoaded(dfd, requires, modName, data, loadedModuleData, alreadyMinified){
    // Check for any modules used from this module that we don't already have
    var newRequires = getModulesRequired(data);
    console.log(" - "+modName+" requires "+JSON.stringify(newRequires));
    // if we need new modules, set them to load and get their promises
    var newPromises = [];
    for (var i in newRequires) {
      if (requires.indexOf(newRequires[i])<0) {
        console.log("   Queueing "+newRequires[i]);
        requires.push(newRequires[i]);
        newPromises.push(loadModule(requires, newRequires[i], loadedModuleData));
      } else {
        console.log("   Already loading "+newRequires[i]);
      }
    }

    var loadProcessedModule = function (moduleCode) {
      // add the module
      loadedModuleData.push("Modules.addCached(" + JSON.stringify(modName) + "," + JSON.stringify(moduleCode) + ");");
      // if we needed to load something, wait until we have all promises complete before resolving our promise!
      if(newPromises.length > 0) {
        $.when.apply(null,newPromises).then(function(){ dfd.resolve(); });
      } else {
        dfd.resolve();
      }  
    }
    if (alreadyMinified)
      loadProcessedModule(data);
    else
      Espruino.callProcessor("transformModuleForEspruino", data, loadProcessedModule);
  }      
  
  /** Given a module name (which could be a URL), try and find it. Return
   * a deferred thingybob which signals when we're done. */
  function loadModule(requires, fullModuleName, loadedModuleData) {
    var dfd = $.Deferred();
    
    // First off, try and find this module using callProcessor 
    Espruino.callProcessor("getModule", 
        { moduleName:fullModuleName, moduleCode:undefined },
        function(data) {
          if (data.moduleCode!==undefined) {
            // great! it found something. Use it.
            moduleLoaded(dfd, requires, fullModuleName, data.moduleCode, loadedModuleData, false); 
          } else {
            // otherwise try and load the module the old way...
            console.log("loadModule("+fullModuleName+")");
            
            var urls; // Array of where to look for this module
            var modName; // Simple name of the module
            if(Espruino.Core.Utils.isURL(fullModuleName)) {
              modName = fullModuleName.substr(fullModuleName.lastIndexOf("/") + 1).split(".")[0];
              urls = [ fullModuleName ];
            } else {
              modName = fullModuleName;
              urls = Espruino.Config.MODULE_EXTENSIONS.split("|").map(function (extension) {
                return Espruino.Config.MODULE_URL + "/" + fullModuleName + extension;
              });
            };
            
            // Recursively go through all the urls
            (function download(urls) {
              if (urls.length==0) {
                Espruino.Core.Notifications.warning("Module "+fullModuleName+" not found");
                return dfd.resolve();
              }
              var dlUrl = urls[0];
              Espruino.Core.Utils.getURL(dlUrl, function (data) {
                if (data!==undefined) {
                  // we got it!
                  moduleLoaded(dfd, requires, fullModuleName, data, loadedModuleData, dlUrl.substr(-7)==".min.js"); 
                } else {
                  // else try next
                  download(urls.slice(1));
                }
              });
            })(urls);
            
             
          }
        }
    );
    
    return dfd.promise();
  }

  /** Finds instances of 'require' and then ensures that 
   those modules are loaded into the module cache beforehand
   (by inserting the relevant 'addCached' commands into 'code' */
  function loadModules(code, callback){
    var loadedModuleData = ["Modules.removeAllCached();"];
    var requires = getModulesRequired(code);
    if (requires.length == 0) {
      // no modules needed - just return
      callback(code);
    } else {
      // Kick off the module loading (each returns a promise)
      var promises = requires.map(function (moduleName) {
        return loadModule(requires, moduleName, loadedModuleData);
      });
      // When all promises are complete
      $.when.apply(null,promises).then(function(){ 
        callback(loadedModuleData.join("\n") + "\n" + code); 
      });
    }
  };
  
  
  Espruino.Core.Modules = {
    init : init
  };
}());
