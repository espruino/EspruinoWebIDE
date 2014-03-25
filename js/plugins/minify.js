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
      type : {"":"No Minification","WHITESPACE_ONLY":"Whitespace Only","SIMPLE_OPTIMIZATIONS":"Simple Optimizations","ADVANCED_OPTIMIZATIONS":"Advanced Optimizations"},
      defaultValue : ""
    });
    
    // When code is sent to Espruino, search it for modules and add extra code required to load them 
    Espruino.addProcessor("transformForEspruino", minifyCode);
  }
  
  function minifyCode(code, callback) {
    if (Espruino.Config.MINIFICATION_LEVEL != "") {
      var minifyObj = $.param({
        compilation_level:Espruino.Config.MINIFICATION_LEVEL,
        output_format:"text",
        output_info:"compiled_code",
        js_code:code
      });      
      $.post(minifyUrl, minifyObj, function(minifiedCode){
        console.log("Minification complete. Code Size reduced from " + code.length + " to " + minifiedCode.length);
        code = minifiedCode;          
      },"text")
        .error(function() { 
          console.warn("Error minifying..."); 
        })
        .complete(function() {
          // ensure we call the callback even if minification failes
          callback(code);
      });
    } else {
     // just shortcut
     callback(code);
    }
  }
  
  Espruino.Plugins.Minify = {
    init : init,
  };
}());