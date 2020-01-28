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
      blocklyWindow.Blockly.prompt = function(title,value,callback) {
        var popup = Espruino.Core.App.openPopup({
          title: "Graphical Editor:",
          padding: true,
          contents: '<p>'+Espruino.Core.Utils.escapeHTML(title)+'</p>'+
                     '<input id="promptinput" value="'+Espruino.Core.Utils.escapeHTML(value)+'" style="width:100%"/>' ,
          position: "center",
          buttons : [
            { name:"Next", callback : function() {
              var value = $('#promptinput').val();
              popup.close();
              callback(value);
            }}]
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

    Espruino.Core.Config.add("BLOCKLY_LANGUAGE", {
      section : "General",
      name : "Graphical Editor Language",
      description : "The language to use for blocks in the graphical editor. Modifying this will restart Blockly and lose any changes.",
      type : { "en": "English", "ru":"Russian", "de": "German" },
      defaultValue : "en",
      onChange : updateBlocklyURL
    });
    Espruino.Core.Config.add("BLOCKLY_EXTENSIONS", {
      section : "General",
      name : "Graphical Editor Extensions",
      description : "Which extra types of blocks to display in the graphical editor. Modifying this will restart Blockly and lose any changes." ,
      type : { "multi_select":true,
       "bluetooth":"Bluetooth LE (Puck.js)",
       "robot":"Espruino Pico Robot",
       "motorshield":"Amperka Motor shield",
       "nordic_thingy":"Nordic Thingy:52",
       "smartibot":"Smartibot"
      },
      defaultValue : "|bluetooth|robot|",
      onChange : updateBlocklyURL
    });
    // Add the HTML we need
    Espruino.addProcessor("initialised", function(data,callback) {
      updateBlocklyURL();
      callback();
    });

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
    // When we connect, see what board we're connected to
    Espruino.addProcessor("environmentVar", function(env, callback) {
      callback(env);
      if (env && env.BOARD=="SMARTIBOT" && Espruino.Config.BLOCKLY_EXTENSIONS.indexOf("|smartibot|")==-1) {
        Espruino.Core.Terminal.addNotification('Looks like you\'re using <a href="https://www.espruino.com/Smartibot" target="_blank">Smartibot</a>!<br>'+
                                               '<button>Click here</button> to enable Smartibot Blockly blocks.',
                                               { buttonclick : function() {
                                                   Espruino.Core.EditorBlockly.addBlocksFor('smartibot');
                                                 }
                                               });
      }
    });
  }

  function updateBlocklyURL() {
    var blocklyUrl = "blockly/blockly.html?lang="+Espruino.Config.BLOCKLY_LANGUAGE;
    blocklyUrl += "&Enable="+encodeURIComponent(Espruino.Config.BLOCKLY_EXTENSIONS);
    if ($("#divblockly").length) {
      /* We have to hide Blockly while it refreshes for some reason or
      it comes up completely broken */
      var inBlockly = Espruino.Core.Code.isInBlockly();
      if (inBlockly) Espruino.Core.Code.switchToCode();
      $("#divblockly")[0].contentWindow.location = blocklyUrl;
      if (inBlockly) setTimeout(function() {
        Espruino.Core.Code.switchToBlockly();
      }, 500);
    } else {
      // Otherwise we just have the iframe
      $('<iframe id="divblockly" class="blocky" style="display:none;border:none;" src="'+blocklyUrl+'"></iframe>').appendTo(".editor--code .editor__canvas");
    }
  }

  function getCode() {
    return Blockly.JavaScript.workspaceToCode(Blockly.mainWorkspace);
  }

  function getXML() {
    return Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(Blockly.mainWorkspace));
  }

  function setXML(xml) {
    Blockly.mainWorkspace.clear();
    Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xml), Blockly.mainWorkspace);
  }

  // Hack around issues Blockly have if we initialise when the window isn't visible
  function setVisible() {
    Blockly.setVisible();
  }

  // Add blocks for something specific to BLOCKLY_EXTENSIONS
  function addBlocksFor(id) {
    if (Espruino.Config.BLOCKLY_EXTENSIONS.indexOf("|"+id+"|")==-1) {
      var e = Espruino.Config.BLOCKLY_EXTENSIONS;
      if (!e.length) e="|"+id+"|";
      else e += id+"|";
      Espruino.Config.set("BLOCKLY_EXTENSIONS", e);
    }
  }

  Espruino.Core.EditorBlockly = {
    init : init,
    getCode : getCode,
    getXML : getXML,
    setXML : setXML,
    setVisible : setVisible,
    addBlocksFor : addBlocksFor
  };
}());
