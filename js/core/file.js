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
  var loadFileCallback;

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
        if (Espruino.Core.Code.isInBlockly())
          loadFile(Espruino.Core.EditorBlockly.setXML, currentXMLFileName);
        else
          loadFile(Espruino.Core.EditorJavaScript.setCode, currentJSFileName);
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
  }

  function setCurrentFileName(filename) {
    if (Espruino.Core.Code.isInBlockly()) {
      currentXMLFileName = filename;
    } else {
      currentJSFileName = filename;
    }
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

  function loadFile(callback, filename) {
    if (chrome.fileSystem) {
      // Chrome Web App / NW.js
      chrome.fileSystem.chooseEntry({type: 'openFile', suggestedName:filename}, function(fileEntry) {
        if (!fileEntry) return;
        if (fileEntry.name) setCurrentFileName(fileEntry.name);
        fileEntry.file(function(file) {
          var reader = new FileReader();
          reader.onload = function(e) {
            callback(convertFromOS(e.target.result));
          };
          reader.onerror = function() {
            Espruino.Core.Notifications.error("Error Loading", true);
          };
          reader.readAsText(file);
        });
      });
    } else {
      Espruino.Core.Utils.fileOpenDialog("code", "text", function(data) {
        callback(convertFromOS(data));
      });
    }
  }

  function saveFile(data, filename) {
    //saveAs(new Blob([convertToOS(data)], { type: "text/plain" }), filename); // using FileSaver.min.js

    function errorHandler() {
      Espruino.Core.Notifications.error("Error Saving", true);
    }

    if (chrome.fileSystem) {
      // Chrome Web App / NW.js
      chrome.fileSystem.chooseEntry({type: 'saveFile', suggestedName:filename}, function(writableFileEntry) {
        if (writableFileEntry.name)
          setCurrentFileName(writableFileEntry.name);
        writableFileEntry.createWriter(function(writer) {
          var blob = new Blob([convertToOS(data)],{ type: "text/plain"} );
          writer.onerror = errorHandler;
          // when truncation has finished, write
          writer.onwriteend = function(e) {
            writer.onwriteend = function(e) {
              console.log('FileWriter: complete');
            };
            console.log('FileWriter: writing');
            writer.write(blob);
          };
          // truncate
          console.log('FileWriter: truncating');
          writer.truncate(blob.size);
        }, errorHandler);
      });
    } else {
      var a = document.createElement("a"),
          file = new Blob([data], {type: "text/plain"});
      var url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
      }, 0);
    }
  };

  Espruino.Core.File = {
    init : init
  };
}());
