/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Handle The Blockly view!
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  var Blockly;
  
  window.blocklyLoaded = function(blockly, blocklyWindow) { // see blockly/blockly.html    
    Blockly = blockly;
    if (blocklyWindow) {
      blocklyWindow.promptAsync = function(title,value,callback) {
        var popup = Espruino.Core.App.openPopup({
          title: "Graphical Editor:",
          padding: true,
          contents: '<p>'+Espruino.Core.Utils.escapeHTML(title)+'</p>'+
                     '<input id="promptinput" value="'+Espruino.Core.Utils.escapeHTML(value)+'" style="width:100%"/>' ,                
          position: "center",
          next : function() {
            var value = $('#promptinput').val();
            popup.close();
            callback(value);
          }
        });
        $('#promptinput').focus();

      };
    }
  };
  
  function init() {
    // Config
    Espruino.Core.Config.add("BLOCKLY_TO_JS", {
      section : "General",
      name : "Overwrite JavaScript with Graphical Editor",
      description : "When you click 'Send to Espruino', should the code from the Graphical Editor overwrite the JavaScript code in the editor window?",
      type : "boolean",
      defaultValue : false, 
    });          
    
    // Add the HTML we need
    $('<iframe id="divblockly" class="blocky" style="display:none;border:none;" src="blockly/blockly.html"></iframe>').appendTo(".editor--code .editor__canvas");
    
    // Handle the 'sending' processor so we can update the JS if we need to...
    Espruino.addProcessor("sending", function(data, callback) {
      if(Espruino.Config.BLOCKLY_TO_JS && Espruino.Core.Code.isInBlockly())
        Espruino.Core.EditorJavaScript.setCode( "// Code from Graphical Editor\n"+Espruino.Core.EditorBlockly.getCode() ); 
      callback(data);
    });
    // when we get JSON for the board, pass it to blockly
    Espruino.addProcessor("boardJSONLoaded", function (data, callback) {
      if (Blockly!==undefined && Blockly.setBoardJSON!==undefined)
        Blockly.setBoardJSON(data);
      callback(data);
    });
  }
  
  function getCode() {
    return Blockly.JavaScript.workspaceToCode('JavaScript');
  }
  
  function getXML() {
    return Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(Blockly.mainWorkspace));
  }
  
  function setXML(xml) {
    Blockly.mainWorkspace.clear();
    Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, Blockly.Xml.textToDom(xml));
  }
  
  Espruino.Core.EditorBlockly = {
    init : init,
    getCode : getCode,
    getXML : getXML,
    setXML : setXML,
  };
}());
