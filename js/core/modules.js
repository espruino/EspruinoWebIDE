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

//Code to handle 'require("...")' and to load the relevant modules
  var BUILT_IN_MODULES = ["http","fs","CC3000","WIZnet"]; // TODO: get these from board.js (hopefully)

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

  /* Finds instances of 'require' and then ensures that 
   those modules are loaded into the module cache beforehand
   (by inserting the relevant 'addCached' commands into 'code' */
  function loadModules(code, callback){
    var promises = [], maxWait = 5000,urlParts;
    var moduleCode = "Modules.removeAllCached();";
    var notFound = "";
    var requires = getModulesRequired(code);
    var urlexp = new RegExp( '(http|https)://' );
    // Kick off the module loading (each returns a promise)
    for(var i = 0; i < requires.length; i++)
      promises.push(loadModule(requires[i]));
    // When all promises are complete
    if(promises.length > 0) {
      $.when.apply(null,promises).then(function(){ 
        callCallback(moduleCode + "\n" + code); 
      });
    } else { 
      callCallback(code);
    }
    
    function callCallback(data){ //send code including all modules if all modules found only
      if (notFound !== "") { 
        Espruino.Core.Notifications.error("module(s) not found",notFound);
      } else {
        callback(data);
      }
    }
    
    // function to actually load the modules
    function loadModule(fullModuleName) {
      console.log("loadModule("+fullModuleName+")");
      var modName,url,extensions;
      if(urlexp.test(fullModuleName)) {
        modName = fullModuleName.substr(fullModuleName.lastIndexOf("/") + 1).split(".")[0];
        url = fullModuleName;
        extensions = [];
      } else {
        modName = fullModuleName;
        url = Espruino.Config.MODULE_URL + "/" + fullModuleName;
        extensions = Espruino.Config.MODULE_EXTENSIONS.split("|");
      }
      
      var t, localUrl,dfd = $.Deferred();
      var extensionTry = 0;
      t = setInterval(function(){clearInterval(t);dfd.resolve();},maxWait);
      if (extensions.length>0){
        downloadModule(url + extensions[extensionTry++]);
      } else {
        code = code.replace("require(\"" + url + "\")","require(\"" + modName + "\")");
        downloadModule(url);
      }        
      return dfd.promise();
      
      function downloadModule(localUrl) { //downloads one module
        // TODO: JumJum's module loading sequence... Use addProcessor again?
        //var sequence = Espruino.Project.getModuleSequence(downloadWeb);  //get order for searching modules (see projects options)
        var sequence = [downloadWeb];
        var sequencePointer = 0;
        downloadSequence();
        function downloadSequence(){  //searches all possible sources for modules in given order, first comes first serves
          if(sequencePointer < sequence.length){
            sequence[sequencePointer](localUrl,modName,checkData);
          }
          else{
            console.log(modName + " not found");
            notFound += "Module " + modName + " not found<br>\n";              
            dfd.resolve();
          }
        }
        function checkData(data){ //checks if module found, if not search in next source
          if(data){gotData(data);}
          else{
            sequencePointer++;
            downloadSequence();
          }
        }
        function downloadWeb(localUrl,modName,callback){  //searches module on www.espruino.com, (for local search see projects)
          $.get(localUrl,callback,"text").fail(function() {
            if(extensionTry < extensions.length) {
              downloadModule(url + extensions[extensionTry++]);
            } 
            else { callback(); }
          });               
        }
      };
      
      function gotData(data){
        moduleCode += "Modules.addCached(" + JSON.stringify(modName) + "," + JSON.stringify(data) + ");\n";
        // Check for any modules used from this module that we don't already have
        var newRequires = getModulesRequired(data);
        console.log(" - "+fullModuleName+" requires "+JSON.stringify(newRequires));
        // if we need new modules, set them to load and get their promises
        var newPromises = [];
        for (var i in newRequires)
          if (requires.indexOf(newRequires[i])<0) {
            requires.push(newRequires[i]);
            newPromises.push(loadModule(newRequires[i]));
          }
        // if we need to load something, wait until we have all promises complete before resolving our promise!
        if(newPromises.length > 0) {
          $.when.apply(null,newPromises).then(function(){ dfd.resolve(); });
        } else {
          dfd.resolve();
        }  
      }        
    }
  };
  
  
  Espruino.Core.Modules = {
    init : init
  };
}());