/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Handling the getting and setting of code
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
    // Configuration
    Espruino.Core.Config.add("AUTO_SAVE_CODE", {
      section : "Communications",
      name : "Auto Save",
      description : "Save code to Chrome's cloud storage when clicking 'Send to Espruino'?",
      type : "boolean",
      defaultValue : 20, 
    });    
    // get code from our config area at bootup
    setTimeout(function() {
      var code;
      if (Espruino.Config.CODE) {
        code = Espruino.Config.CODE;
        console.log("Loaded code from storage.");
      } else {
        code = "var  l = false;\nsetInterval(function() {\n  l = !l;\n  LED1.write(l);\n}, 500);";
        console.log("No code in storage.");
      }
      Espruino.Core.EditorJavaScript.setCode(code);
    },1);
  }
  
  function eventHandler(eventType) {
    if (eventType=="sending") {
      if(Espruino.Config.AUTO_SAVE_CODE){
        Espruino.Config.set("CODE", Espruino.Core.EditorJavaScript.getCode()); // save the code
      }
    }
  }
  
  function getEspruinoCode(callback) {
    Espruino.Core.Modules.loadModules(getCurrentCode(), callback);
  }
  
  function getCurrentCode() {
    if (Espruino.Core.Layout.isInBlockly()) {
      return Espruino.Core.EditorBlockly.getCode();
    } else {
      return Espruino.Core.EditorJavaScript.getCode();
    }
  }
  
  Espruino.Core.Code = {
    init : init,
    eventHandler : eventHandler,
    getEspruinoCode : getEspruinoCode, // get the currently selected bit of code ready to send to Espruino (including Modules)
    getCurrentCode : getCurrentCode, // get the currently selected bit of code (either blockly or javascript editor)
  };
}());