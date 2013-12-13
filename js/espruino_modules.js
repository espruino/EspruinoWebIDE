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
      fileExtensions : [ ".min.js"/*, ".js"*/ ] // FIXME fileExtensions is not used
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
      var defs = [], maxWait = 5000,urlParts;
      var requires = getModulesRequired(code);
      var moduleCode = "Modules.removeAllCached();";
      var urlexp = new RegExp( '(http|https)://[\\w-]+(\\.[\\w-]+)+([\\w-.,@?^=%&:/~+#-]*[\\w@?^=%&;/~+#-])?' );
      for(var i = 0; i < requires.length; i++){
        if(urlexp.test(requires[i])){
          defs.push(loadModule(requires[i].substr(requires[i].lastIndexOf("/") + 1).split(".")[0],requires[i]));}
        else{defs.push(loadModule(requires[i],Espruino.Modules.Config.url + "/" + requires[i],".min.js",".js"));}
      }
      if(defs.length > 0) {$.when.apply(null,defs).then(function(){returnCode();});}
      else{callback(code);}      
      function loadModule(modName,url,firstTry,secondTry){
        var t, localUrl,dfd = $.Deferred();
        if(firstTry){ localUrl = url + firstTry; }
        else{
          localUrl = url;
          code = code.replace("require(\"" + url + "\")","require(\"" + modName + "\")");
        }
        t = setInterval(function(){clearInterval(t);dfd.resolve();},maxWait);
        $.get(localUrl,function(data){
          moduleCode += "Modules.addCached(" + JSON.stringify(modName) + "," + JSON.stringify(data) + ");\n";
          dfd.resolve();
        },"text").fail(function(){
          if(secondTry){
            localUrl = url + secondTry;
            $.get(localUrl,function(data){
              moduleCode += "Modules.addCached(" + JSON.stringify(modName) + "," + JSON.stringify(data) + ");\n";
              dfd.resolve();
            },"text").fail(function(){ console.log(modName + " not found");dfd.resolve();});
          }
          else{console.log(modName + " not found"); dfd.resolve();}   
        });
        return dfd.promise();
      }
      function returnCode(){ callback(moduleCode + "\n" + code); }
    };

})();
