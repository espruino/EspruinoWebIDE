/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Handling the getting and setting of code
 ------------------------------------------------------------------
**/
(function(){

  var viewModeButton;

  function init() {
    // Configuration
    Espruino.Core.Config.add("AUTO_SAVE_CODE", {
      section : "Communications",
      name : "Auto Save",
      description : "Save code to local storage",
      type : "boolean",
      defaultValue : true,
    });

    // Setup code mode button
    viewModeButton = Espruino.Core.App.addIcon({
      id: "code",
      icon: "code",
      title : "Switch between Code and Graphical Designer",
      order: 0,
      area: {
        name: "code",
        position: "bottom"
      },
      click: function() {
        if (isInBlockly()) {
          switchToCode();
          Espruino.Core.EditorJavaScript.madeVisible();
        } else {
          switchToBlockly();
        }
      }
    });

    // get code from our config area at bootup
    Espruino.addProcessor("initialised", function(data,callback) {
      var code;
      if (Espruino.Config.AUTO_SAVE_CODE && typeof window !== 'undefined' && window.localStorage) {
        code = window.localStorage.getItem("JSCODE");
        console.log("Loaded code from local storage.");
      }
      if (!code) {
        code = Espruino.Core.Code.DEFAULT_CODE;
        console.log("No code in storage.");
      }
      Espruino.Core.EditorJavaScript.setCode(code);
      callback(data);
    });
    Espruino.addProcessor("sending", function(data, callback) {
      // save the code to local storage - not rate limited
      if(Espruino.Config.AUTO_SAVE_CODE && typeof window !== 'undefined' && window.localStorage)
        window.localStorage.setItem("JSCODE", Espruino.Core.EditorJavaScript.getCode());
      callback(data);
    });
    Espruino.addProcessor("jsCodeChanged", function(data, callback) {
      // save the code to local storage - not rate limited
      if(Espruino.Config.AUTO_SAVE_CODE && typeof window !== 'undefined' && window.localStorage)
        window.localStorage.setItem("JSCODE", data.code);
      callback(data);
    });
  }

  function isInBlockly() { // TODO: we should really enumerate views - we might want another view?
    return $("#divblockly").is(":visible");
  };

  function switchToBlockly() {
    $("#divcode").hide();
    $("#divblockly").show();
    viewModeButton.setIcon("block");
    // Hack around issues Blockly have if we initialise when the window isn't visible
    Espruino.Core.EditorBlockly.setVisible();
  }

  function switchToCode() {
    $("#divblockly").hide();
    $("#divcode").show();
    viewModeButton.setIcon("code");
  }

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

  function focus() {
    if (isInBlockly()) {
      document.querySelector("#divblockly").focus();
    } else {
      //document.querySelector(".CodeMirror").focus();
      Espruino.Core.EditorJavaScript.getCodeMirror().focus()
    }
  }

  Espruino.Core.Code = {
    init : init,
    getEspruinoCode : getEspruinoCode, // get the currently selected bit of code ready to send to Espruino (including Modules)
    getCurrentCode : getCurrentCode, // get the currently selected bit of code (either blockly or javascript editor)
    isInBlockly: isInBlockly,
    switchToCode: switchToCode,
    switchToBlockly: switchToBlockly,
    focus : focus, // give focus to the current code editor
    DEFAULT_CODE : "var  on = false;\nsetInterval(function() {\n  on = !on;\n  LED1.write(on);\n}, 500);"
  };
}());
