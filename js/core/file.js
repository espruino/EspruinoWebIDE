/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  File Load/Save
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  var currentJSFileName = "code.js";
  var currentXMLFileName = "code_blocks.xml";
  
  function init() {
    // Configuration
    
   
    // Add stuff we need
    Espruino.Core.App.addIcon({ 
      id: "openFile",
      icon: "folder-open", 
      title : "Open File", 
      order: 100, 
      area: { 
        name: "code", 
        position: "top"
      }, 
      click: function() {
        // this should ensure that if we load the same file, it works second time round
        document.getElementById('fileLoader').value = '';
        // fire the file loader
        $( "#fileLoader" ).click();
      }
    });

    Espruino.Core.App.addIcon({ 
      id: "saveFile",
      icon: "save", 
      title : "Save File", 
      order: 200, 
      area: { 
        name: "code", 
        position: "top"
      },
      click: function() {
        if (Espruino.Core.Code.isInBlockly()) 
          saveFile(Espruino.Core.EditorBlockly.getXML(), currentXMLFileName);
        else
          saveFile(Espruino.Core.EditorJavaScript.getCode(), currentJSFileName);
      }
    });
    
    
    // required for file loading... (hidden)
    $('<input type="file" id="fileLoader" style="display: none;"/>').appendTo(document.body);

    $("#fileLoader").change(function(event) {
      if (event.target.files.length != 1) return;
      var reader = new FileReader();
      reader.onload = function(event) {
        // Get the last loaded filename
        var currentFileName = document.getElementById('fileLoader').value;       
        currentFileName = currentFileName.substr(currentFileName.lastIndexOf("\\")+1);
        // Load data
        var data = convertFromOS(event.target.result);
        if (Espruino.Core.Code.isInBlockly()) {
          Espruino.Core.EditorBlockly.setXML(data);          
          currentXMLFileName = currentFileName;
        } else { 
          Espruino.Core.EditorJavaScript.setCode(data);
          currentJSFileName = currentFileName;
        }
      };
      reader.readAsText(event.target.files[0]);
    });
        
  }
  
  /**  Handle newline conversions - Windows expects newlines as /r/n when we're saving/loading files */
  function convertFromOS(chars) {
   if (!Espruino.Core.Utils.isWindows()) return chars;
   return chars.replace(/\r\n/g,"\n");
  };
  
  /**  Handle newline conversions - Windows expects newlines as /r/n when we're saving/loading files */
  function convertToOS(chars) {
   if (!Espruino.Core.Utils.isWindows()) return chars;
   return chars.replace(/\r\n/g,"\n").replace(/\n/g,"\r\n");
  };  
  
  var saveFile = function(data, filename) {
    //saveAs(new Blob([convertToOS(data)], { type: "text/plain" }), filename); // using FileSaver.min.js

    function errorHandler() {
      Espruino.Core.Notifications.error("Error Saving", true);     
    }

    chrome.fileSystem.chooseEntry({type: 'saveFile', suggestedName:filename}, function(writableFileEntry) {
      writableFileEntry.createWriter(function(writer) {
        writer.onerror = errorHandler;
        writer.onwriteend = function(e) {
          console.log('write complete');
        };
        writer.write(new Blob([convertToOS(data)], { type: "text/plain" }));
      }, errorHandler);
    });
  };  

  Espruino.Core.File = {
    init : init
  };
}());
