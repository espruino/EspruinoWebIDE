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
    
    // When code is sent to Espruino, search it for modules and add extra code required to load them 
    Espruino.addProcessor("transformForEspruino", minifyCode);
  }
  
  function closureCompiler(code, output_info, callback) {
    var minifyObj = $.param({
      compilation_level: Espruino.Config.MINIFICATION_LEVEL,
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

  function minifyCode(code, callback) {
    if (Espruino.Config.MINIFICATION_LEVEL != "") {
      // if we've been asked to minify...       
      closureCompiler(removeBinaryNumbers(code), 'compiled_code', function(minified) {
        if (minified.trim()!="") { 
          console.log("Minification complete. Code Size reduced from " + code.length + " to " + minified.length);
          console.log(JSON.stringify(minified));
          callback(minified);
        } else {
          Espruino.Core.Notifications.warning("Errors while minifying - sending unminified code.");
          callback(code);
          // get errors...
          closureCompiler(code, 'errors', function(errors) {
            console.log("Closure compiler errors: "+errors);
            errors.split("\n").forEach(function (err) {
              if (err.trim()!="")
                Espruino.Core.Notifications.error(err.trim());
            });
          });
        }
      });
    } else {
      // just pass code onwards
      callback(code);
    }
  }
  
  Espruino.Plugins.Minify = {
    init : init,
  };
}());
