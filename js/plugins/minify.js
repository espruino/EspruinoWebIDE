/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Automatically minify code before it is sent to Espruino
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  var minifyUrl = "http://closure-compiler.appspot.com/compile";
  
  function init() {
    Espruino.Core.Config.add("MINIFICATION_LEVEL", {
      section : "Communications",
      name : "Minification",
      description : "Automatically minify sent code? This will save Espruino's memory and may increase execution speed, but it will make debugging harder.",
      type : { "":"No Minification",
               "WHITESPACE_ONLY":"Whitespace Only",
               "SIMPLE_OPTIMIZATIONS":"Simple Optimizations",
               "ADVANCED_OPTIMIZATIONS":"Advanced Optimizations (not recommended)"},
      defaultValue : ""
    });
    Espruino.Core.Config.add("MODULE_MINIFICATION_LEVEL", {
      section : "Communications",
      name : "Module Minification",
      description : "Automatically minify modules? This will save Espruino's memory and may increase execution speed, but it will make debugging modules harder. Modules with the extension .min.js will not be minified by default.",
      type : { "":"No Minification",
               "WHITESPACE_ONLY":"Whitespace Only",
               "SIMPLE_OPTIMIZATIONS":"Simple Optimizations",
               "ADVANCED_OPTIMIZATIONS":"Advanced Optimizations (not recommended)"},
      defaultValue : "WHITESPACE_ONLY"
    });
    
    // When code is sent to Espruino, search it for modules and add extra code required to load them 
    Espruino.addProcessor("transformForEspruino", minifyEspruino);
   // When code is sent to Espruino, search it for modules and add extra code required to load them 
    Espruino.addProcessor("transformModuleForEspruino", minifyModule);
  }
  
  function closureCompiler(code, minificationLevel, output_info, callback) {
    var minifyObj = $.param({
      compilation_level: minificationLevel,
      output_format: "text",
      output_info: output_info,
      js_code: code
    });      
    $.post(minifyUrl, minifyObj, function(minifiedCode) {      
      code = minifiedCode;          
    },"text")
      .error(function() { 
        Espruino.Core.Notifications.error("HTTP error while minifying.");
      })
      .complete(function() {
        // ensure we call the callback even if minification failes
        callback(code);
    });
  }

  function removeBinaryNumbers(code) {
    // replace all binary numbers with parseInt
    return code.replace(/0b([01][01]*)/g, "parseInt(\"$1\",2)");
  }

  function minifyCode(code, callback, minificationLevel) {
    closureCompiler(removeBinaryNumbers(code), minificationLevel, 'compiled_code', function(minified) {
      if (minified.trim()!="") { 
        console.log("Minification complete. Code Size reduced from " + code.length + " to " + minified.length);
        console.log(JSON.stringify(minified));
        callback(minified);
      } else {
        Espruino.Core.Notifications.warning("Errors while minifying - sending unminified code.");
        callback(code);
        // get errors...
        closureCompiler(code, minificationLevel, 'errors', function(errors) {
          console.log("Closure compiler errors: "+errors);
          errors.split("\n").forEach(function (err) {
            if (err.trim()!="")
              Espruino.Core.Notifications.error(err.trim());
          });
        });
      }
    });
  }

  function minifyEspruino(code, callback) {
    if (Espruino.Config.MINIFICATION_LEVEL != "") {
      // if we've been asked to minify...
      minifyCode(code, callback, Espruino.Config.MINIFICATION_LEVEL);
    } else {
      // just pass code onwards
      callback(code);
    }
  }

  function minifyModule(code, callback) {
    if (Espruino.Config.MODULE_MINIFICATION_LEVEL != "") {
      /* we add a header and footer to make sure that the closure compiler
      can rename non-public constants, but NOT the `exports` variable.*/
      var header = "(function(){";
      var footer = "})();";
      // if we've been asked to minify...
      minifyCode(header+code+footer, function(minified) {
       callback(minified.substr(header.length, minified.length-(header.length+footer.length+1)));
      }, Espruino.Config.MODULE_MINIFICATION_LEVEL);
    } else {
      // just pass code onwards
      callback(code);
    }
  }
  
  Espruino.Plugins.Minify = {
    init : init,
  };
}());
