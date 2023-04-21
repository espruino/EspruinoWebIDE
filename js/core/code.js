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



  function init() {
    
  }

  function isInBlockly() { 
    //return $("#divblockly").is(":visible");
    // jQuery caused a (handled) exception when doing the above - but it still wasn't great
    var elem = document.getElementById("divblockly");
    return elem && !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length )
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
    switchToCode: function() { throw new Error("removed switchToCode"); },
    switchToBlockly: function() { throw new Error("removed switchToBlockly"); },
    focus : focus, // give focus to the current code editor
    DEFAULT_CODE : "var  on = false;\nsetInterval(function() {\n  on = !on;\n  LED1.write(on);\n}, 500);"
  };
}());
