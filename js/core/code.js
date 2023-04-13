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
  }

  function isInBlockly() { // TODO: we should really enumerate views - we might want another view?
    //return $("#divblockly").is(":visible");
    // jQuery caused a (handled) exception when doing the above - but it still wasn't great
    var elem = document.getElementById("divblockly");
    return elem && !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length )
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
