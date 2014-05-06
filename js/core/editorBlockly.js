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
  
  window.blocklyLoaded = function(blockly) { // see blockly/blockly.html
    Blockly = blockly;
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
  }
  
  function getCode() {
    return Blockly.Generator.workspaceToCode('JavaScript');
  }
  
  function getXML() {
    return Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(Blockly.mainWorkspace));
  }
  
  function setXML(xml) {
    Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, Blockly.Xml.textToDom(xml));
  }
  
  Espruino.Core.EditorBlockly = {
    init : init,
    getCode : getCode,
    getXML : getXML,
    setXML : setXML,
  };
}());