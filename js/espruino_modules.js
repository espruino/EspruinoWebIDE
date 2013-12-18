/*
 * The MIT License

Copyright (c) 2013 by Juergen Marsch

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
"use strict";
(function(){
    // Code to handle 'require("...")' and to load the relevant modules
    Espruino["Modules"] = {};
    Espruino.Modules.Config = {
      url : "http://www.espruino.com/modules",
      fileExtensions : [ ".min.js", ".js" ]
    };
    Espruino.Modules["initOptions"] = function(){
      Espruino.Options.optionFields.push({id:"#urlModules",module:"Modules",object:"Config",field:"url",type:"text"});
      Espruino.Options.optionFields.push({id:"#fileExtensionsModules",module:"Modules",object:"Config",field:"fileExtensions",type:"JSON"});
      Espruino.Options.optionBlocks.push();
      Espruino.Options.optionBlocks.push({id:"#divOptionModules",htmlUrl:"data/Espruino_Modules.html"});
    };
    Espruino.Modules.init = function(){
    };

    var getModulesRequired = function(code) {
      var modules = [];
      var requires = code.match(/require\(\"[^\"]*\"\)/g);
      for (var i in requires) { 
        // strip off beginning and end, and parse the string
        var module = JSON.parse(requires[i].substring(8,requires[i].length-1));
        // add it to our array - FIXME don't hard code these
        var builtin_modules = ["http","fs","CC3000"];
        if (builtin_modules.indexOf(module)<0 && modules.indexOf(module)<0)
          modules.push(module);
      }    
      return modules;
    };

    /* Finds instances of 'require' and then ensures that 
     those modules are loaded into the module cache beforehand
     (by inserting the relevant 'addCached' commands into 'code' */
    Espruino.Modules.loadModules = function(code,callback){
      var promises = [], maxWait = 5000,urlParts;
      var moduleCode = "Modules.removeAllCached();";
      
      var requires = getModulesRequired(code);      
      var urlexp = new RegExp( '(http|https)://[\\w-]+(\\.[\\w-]+)+([\\w-.,@?^=%&:/~+#-]*[\\w@?^=%&;/~+#-])?' );
      // Kick off the module loading (each returns a promise)
      for(var i = 0; i < requires.length; i++)
        promises.push(loadModule(requires[i]));
      // When all 
      if(promises.length > 0) {
        $.when.apply(null,promises).then(function(){ callback(moduleCode + "\n" + code); });
      } else {
        callback(code);
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
          url = Espruino.Modules.Config.url + "/" + fullModuleName; 
          extensions = Espruino.Modules.Config.fileExtensions;
        }
        
        var t, localUrl,dfd = $.Deferred();
        var extensionTry = 0;
        var downloadModule = function(localUrl) {
          $.get(localUrl,function(data){            
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
            
          },"text").fail(function() {
            if(extensionTry < extensions.length) {
              downloadModule(url + extensions[extensionTry++]);
            } else { 
              console.log(modName + " not found"); 
              dfd.resolve();
            }   
          });
        };
        
        t = setInterval(function(){clearInterval(t);dfd.resolve();},maxWait);        
        if (extensions.length>0){ 
          downloadModule(url + extensions[extensionTry++]);
        } else {          
          code = code.replace("require(\"" + url + "\")","require(\"" + modName + "\")");
          downloadModule(url);
        }
        
        return dfd.promise();
      }
    };

})();
