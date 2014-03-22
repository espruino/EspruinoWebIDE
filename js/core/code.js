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

    // Setup code mode button
    var viewButton = Espruino.Core.App.addIcon({ 
      name: "code", 
      title : "Switch between Code and Graphical Designer", 
      order: 0, 
      area: {
        name: "code",
        position: "bottom"
      }
    }, function() {
      if (isInBlockly()) {
        $("#divblockly").hide();
        $("#divcode").show();
        viewButton.setIcon("code");
      } else {
        $("#divcode").hide();
        $("#divblockly").show();
        viewButton.setIcon("block");
      }
    })

    // get code from our config area at bootup
    Espruino.addProcessor("initialised", function(data,callback) {
      var code;
      if (Espruino.Config.CODE) {
        code = Espruino.Config.CODE;
        console.log("Loaded code from storage.");
      } else {
        code = "var  l = false;\nsetInterval(function() {\n  l = !l;\n  LED1.write(l);\n}, 500);";
        console.log("No code in storage.");
      }
      Espruino.Core.EditorJavaScript.setCode(code);
      callback(data);
    });
    
    
    Espruino.addProcessor("sending", function(data, callback) {
      if(Espruino.Config.AUTO_SAVE_CODE)
        Espruino.Config.set("CODE", Espruino.Core.EditorJavaScript.getCode()); // save the code
      callback(data);
    });
  }
  
  function isInBlockly() { // TODO: we should really enumerate views - we might want another view?
    return $("#divblockly").is(":visible");
  };

  function getEspruinoCode(callback) {
    Espruino.callProcessor("transformForEspruino", getCurrentCode(), callback);
  }
  
  function getCurrentCode() {
    if (isInBlockly()) {
      return Espruino.Core.EditorBlockly.getCode();
    } else {
      return Espruino.Core.EditorJavaScript.getCode();
    }
  }
  
  Espruino.Core.Code = {
    init : init,
    getEspruinoCode : getEspruinoCode, // get the currently selected bit of code ready to send to Espruino (including Modules)
    getCurrentCode : getCurrentCode, // get the currently selected bit of code (either blockly or javascript editor)
    isInBlockly: isInBlockly
  };
}());