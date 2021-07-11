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
  var watchIntervalHandle;
  var fileLastModified = -Infinity;
  var currentFileHandle;
  var currentJSFileName = "code.js";
  var currentXMLFileName = "code_blocks.xml";
  var loadFileCallback;

  const WATCH_INTERVAL = 1000;
  const MIMETYPE_JS = {"application/javascript": [".js", ".js"], "text/plain": [".txt"]};
  const MIMETYPE_XML = {"text/xml": [".xml"]};
  
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
        var loadFileArguments = Espruino.Core.Code.isInBlockly()
          ? [Espruino.Core.EditorBlockly.setXML, currentXMLFileName, MIMETYPE_XML]
          : [Espruino.Core.EditorJavaScript.setCode, currentJSFileName, MIMETYPE_JS];

        if (chrome.fileSystem || typeof window.showOpenFilePicker !== 'function') {
          loadFile(...loadFileArguments);
          return;
        }

        var callback = async function() {
          if (watchIntervalHandle) {
            clearInterval(watchIntervalHandle);
            watchIntervalHandle = undefined;
          }

          fileLastModified = -Infinity;
          var closePopup = await loadFile(...loadFileArguments);
          if (closePopup) {
            popup.close();
          }
        };

        var listItems = [{
          icon : "icon-folder-open",
          title : "Open File",
          description : "Load file from disk",
          callback : callback
        },{
          icon : "icon-refresh",
          title : "Open and Watch File",
          description : "Load and watch for changes",
          callback : async function() {
            await callback();
            watchIntervalHandle = setInterval(readFileContents, WATCH_INTERVAL, loadFileArguments[0]);
          }
        }];

        var domList = Espruino.Core.HTML.domList(listItems);
        var popup = Espruino.Core.App.openPopup({
          id: "fileopenmodeselector",
          title: "Select a mode...",
          contents: "",
          position: "center",
        });
        popup.setContents(domList);
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
          Espruino.Core.Utils.fileSaveDialog(convertToOS(Espruino.Core.EditorBlockly.getXML()), currentXMLFileName, setCurrentFileName);
        else
          Espruino.Core.Utils.fileSaveDialog(convertToOS(Espruino.Core.EditorJavaScript.getCode()), currentJSFileName, setCurrentFileName);
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

  async function loadFile(callback, filename, mimeType) {
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
    } else if (typeof window.showOpenFilePicker === 'function') {
      try {
        var [fileHandle] = await window.showOpenFilePicker({types: [{accept: mimeType}]});
        if (fileHandle.name) {
          setCurrentFileName(fileHandle.name);
        }
        
        currentFileHandle = fileHandle;
        readFileContents(callback);
      } catch (_ /* abort */) {
        return false;
      }
    } else {
      const mt = Object.values(mimeType).reduce((a, b) => `${a},${b}`) + "," + Object.keys(mimeType);
      Espruino.Core.Utils.fileOpenDialog({id:"code",type:"text",mimeType:mt}, function(data, mimeType, fileName) {
        if (fileName) setCurrentFileName(fileName);
        callback(convertFromOS(data));
      });
    }

    return true;
  }

  async function readFileContents(callback) {
    if (!currentFileHandle) {
      return;
    }

    var file = await currentFileHandle.getFile();
    if (file.lastModified > fileLastModified) {
      var contents = await file.text();
      fileLastModified = file.lastModified;
      callback(convertFromOS(contents));
    }
  }

  Espruino.Core.File = {
    init : init
  };
}());
