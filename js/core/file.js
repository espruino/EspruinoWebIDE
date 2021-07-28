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

  // how many millisecs between checking a file for modification?
  const WATCH_INTERVAL = 1000;
  // types of file we accept
  const MIMETYPE_JS = {"application/javascript": [".js", ".js"], "text/plain": [".txt"]};
  const MIMETYPE_XML = {"text/xml": [".xml"]};

  var currentJSFile = {
    name:"code.js",
    mimeTypes : MIMETYPE_JS,
    // also setValue, getValue, handle, lastModified
  };
  var currentXMLFile = {
    name:"code_blocks.xml",
    mimeTypes : MIMETYPE_XML,
  };
  var currentFiles = [currentJSFile, currentXMLFile];

  var iconOpenFile;
  var iconSaveFile;
  // interval used when checking files for modification
  var watchInterval;
  // What we should do when clicking the 'openFile' button
  var openFileMode = "open"; // open, reload, watch, upload



  function init() {
    currentJSFile.setValue = Espruino.Core.EditorJavaScript.setCode;
    currentJSFile.getValue = Espruino.Core.EditorJavaScript.getCode;
    currentXMLFile.setValue = Espruino.Core.EditorBlockly.setXML;
    currentXMLFile.getValue = Espruino.Core.EditorBlockly.getXML;

    // Open file icon
    var icon = {
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
          loadFile(currentXMLFile);
        else
          loadFile(currentJSFile);
      }
    };
    // Only add extra options if showOpenFilePicker is available
    if (typeof window.showOpenFilePicker === 'function') {
      icon.more = function() {
        var popup = Espruino.Core.App.openPopup({
          id: "fileopenmodeselector",
          title: "Open File should...",
          contents: Espruino.Core.HTML.domList([{
              icon : "icon-folder-open", title : "Open File",
              description : "Load file from disk", callback : function() { setOpenFileMode("open");popup.close(); }
            },{
              icon : "icon-folder-open", title : "Reload File",
              description : "Reload the current file", callback : function() { setOpenFileMode("reload");popup.close(); }
            },{
              icon : "icon-refresh", title : "Watch File",
              description : "Watch for changes", callback : function() { setOpenFileMode("watch");popup.close(); }
            },{
              icon : "icon-refresh", title : "Watch and Upload",
              description : "Watch for changes and upload", callback : function() { setOpenFileMode("upload");popup.close(); }
            }
          ]),
          position: "center",
        });
      };
      icon.info = "open";
    }
    iconOpenFile = Espruino.Core.App.addIcon(icon);
    // Save file icon
    iconSaveFile = Espruino.Core.App.addIcon({
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
          saveFile(currentXMLFile);
        else
          saveFile(currentJSFile);
      }
    });
  }

  function setOpenFileMode(mode) {
    iconOpenFile.setInfo(mode);
    openFileMode = mode;
    if (watchInterval) clearInterval(watchInterval);
    watchInterval = undefined;
    // if we're in
    if (openFileMode == "watch" || openFileMode == "upload") {
      watchInterval = setInterval(function() {
        currentFiles.forEach(readFileContents);
      }, WATCH_INTERVAL);
    }
  }

  function setCurrentFileName(filename) {
    if (Espruino.Core.Code.isInBlockly()) {
      currentXMLFile.name = filename;
    } else {
      currentJSFile.name = filename;
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

  function loadFile(currentFile) {
    currentFile.lastModified = undefined;
    /* if clicking the button should just reload the existing file,
    do that */
    if (openFileMode == "reload" && currentFile.handle) {
      readFileContents(currentFile);
      return;
    }
    currentFile.handle = undefined;

    if (typeof window.showOpenFilePicker === 'function') {
      window.showOpenFilePicker({types: [{accept: currentFile.mimeTypes}]}).
      then(function(fileHandles) {
        var fileHandle = fileHandles[0];
        if (fileHandle.name) {
          setCurrentFileName(fileHandle.name);
        }
        currentFile.handle = fileHandle;
        readFileContents(currentFile);
      });
    } else if (chrome.fileSystem) {
      // Chrome Web App / NW.js
      chrome.fileSystem.chooseEntry({type: 'openFile', suggestedName:currentFile.name}, function(fileEntry) {
        if (!fileEntry) return;
        if (fileEntry.name) setCurrentFileName(fileEntry.name);
        fileEntry.file(function(file) {
          var reader = new FileReader();
          reader.onload = function(e) {
            currentFile.setValue(convertFromOS(e.target.result));
          };
          reader.onerror = function() {
            Espruino.Core.Notifications.error("Error Loading", true);
          };
          reader.readAsText(file);
        });
      });
    } else {
      var mimeTypeList = Object.values(currentFile.mimeTypes) + "," + Object.keys(currentFile.mimeTypes);
      Espruino.Core.Utils.fileOpenDialog({id:"code",type:"text",mimeType:mimeTypeList}, function(data, mimeType, fileName) {
        if (fileName) setCurrentFileName(fileName);
        currentFile.setValue(convertFromOS(data));
      });
    }
  }


  // read a file from window.showOpenFilePicker
  function readFileContents(currentFile) {
    if (!currentFile.handle) {
      return;
    }

    var file;
    currentFile.handle.getFile().then(function(f) {
      file = f;
      // if file is newer, proceed to load it
      if (!currentFile.lastModified ||
          file.lastModified > currentFile.lastModified)
        return file.text();
      else
        return undefined;
    }).then(function(contents) {
      if (!contents) return;
      // if loaded, update editor
      currentFile.lastModified = file.lastModified;
      currentFile.setValue(convertFromOS(contents));
      if (openFileMode == "upload") {
        Espruino.Core.Notifications.info(new Date().toLocaleTimeString() + ": " + currentFile.name+" changed, uploading...");
        Espruino.Plugins.KeyShortcuts.action("icon-deploy");
      }
    });
  }

  function saveFile(currentFile) {
    /* TODO: if currentFile.handle, we could write direct to this
    file without the dialog. But then what do we do for 'save as'? The down-arrow
    next to the icon? */
    Espruino.Core.Utils.fileSaveDialog(convertToOS(currentFile.getValue()), currentFile.name, function(name) {
      currentFile.name = name;
    });
  }

  Espruino.Core.File = {
    init : init
  };
}());
