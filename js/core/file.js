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
    description:"JavaScript files",
    mimeTypes : MIMETYPE_JS,
    // also setValue, getValue, handle, lastModified
  };
  var currentXMLFile = {
    name:"code_blocks.xml",
    description:"Blockly XML files",
    mimeTypes : MIMETYPE_XML,
  };
  var currentFiles = [currentJSFile, currentXMLFile];

  var iconOpenFile;
  var iconSaveFile;
  // interval used when checking files for modification
  var watchInterval;
  // What we should do when clicking the 'openFile' button
  var openFileMode = "open"; // open, reload, watch, upload

  // Files contains objects of this type:
  function getDefaultFile() {
    return {
      fileName : "Untitled.js", // file path in filesystem 
      storageFile : "", // file on Espruino device (Espruino.Config.SAVE_STORAGE_FILE)
      sendMode : 0,    // file on Espruino device (Espruino.Config.SAVE_ON_SEND)
      contents : Espruino.Core.Code.DEFAULT_CODE,    // the actual file contents
    };
  }

  var files = [
  ];
  var activeFile = 0; // index of active file

  function setActiveFile(idx) {
    if (idx<0 || idx>=files.length) throw new Error("File index out of range");
    // Old state should all be saved automatically...

    // Apply new state
    activeFile = -1; // so we don't try and update this file when things change
    if(typeof window !== 'undefined' && window.localStorage)
      window.localStorage.setItem(`FILE_ACTIVE`, idx);
    Espruino.Config.set("SAVE_ON_SEND", 0|files[idx].sendMode);
    Espruino.Config.set("SAVE_STORAGE_FILE", files[idx].storageName||"");
    setCurrentFileName(files[idx].fileName);
    currentJSFile.setValue(files[idx].contents);
    activeFile = idx; // now we're ok to set the active file
    saveFileConfig();
    // we need to change which tab is active
    updateFileTabs();
    // Change the state of the send icon
    Espruino.Core.Send.updateIconInfo();
  }
  
  function loadFileConfig() {
    if (typeof window == 'undefined' || !window.localStorage) return;
    var fileCount = 0|window.localStorage.getItem(`FILES`);
    files = [];
    for (var idx=0;idx<fileCount;idx++) {
      var file = {};
      file.contents = window.localStorage.getItem(`FILE${idx}_CODE`);
      try {
        var info = JSON.parse(window.localStorage.getItem(`FILE${idx}_INFO`))
        file.fileName = info.fileName;
        file.storageName = info.storageName;
        file.sendMode = info.sendMode;
        files.push(file);
      } catch(e) {      
      }
    }
    var newActiveFile = 0|window.localStorage.getItem(`FILE_ACTIVE`);
    if (newActiveFile<0 || newActiveFile>=files.length)
    newActiveFile = 0;
    setActiveFile(newActiveFile)
  }

  function saveFileConfig() {
    if (typeof window == 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(`FILES`, files.length);
    window.localStorage.setItem(`FILE_ACTIVE`, activeFile);
    files.forEach((file,idx) => {
      window.localStorage.setItem(`FILE${idx}_CODE`, file.contents);
      window.localStorage.setItem(`FILE${idx}_INFO`, JSON.stringify({
        fileName : file.fileName,
        storageName : file.storageName,
        sendMode : file.sendMode
      }));
    });    
  }

  function createFileTabs() {
    var element = Espruino.Core.HTML.domElement('<div id="file_list"></div>');
    document.querySelector(".toolbar").append(element);
  }

  function closeFileTab(idx) {
    // TODO: Check whether it needs saving?
    console.log(`File> Closing tab ${idx}: ${files[idx].fileName}`);
    if (activeFile==idx) {
      // Change to a new file
      if (activeFile>0) setActiveFile(activeFile-1);
      else {
        if (files.length<2) { // if not enough files, add a new file
          files.push(getDefaultFile());
        }
        setActiveFile(activeFile+1);
      }
    }
    // remove the old one
    console.log(JSON.stringify(files,null,2), idx);
    files.splice(idx,1);
    console.log(files);
    if (activeFile>idx) activeFile--;
    saveFileConfig();
    // update the file list
    updateFileTabs();
  }

  function updateFileTabs() {
    var fileList = document.querySelector("#file_list");
    fileList.innerHTML = files.map( (f,idx) => {
      let active = activeFile==idx;
      return `<span class="${active?'active':'inactive'}" fileIndex="${idx}">📄 ${f.fileName||"Untitled"}${active?'&nbsp;<span class="close">&#10005;</span>':""}</span>` 
    }).join("");
    var node = fileList.firstChild;
    while (node) {
      node.addEventListener("click", function(e) {
        e.preventDefault();
        if (e.target.classList.contains("close")) {
          closeFileTab(activeFile);
        } else {
          setActiveFile(parseInt(e.target.getAttribute("fileIndex")));
        }
      });
      node = node.nextSibling;
    }
  }


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
    // Create the tabs showing what files we have
    createFileTabs();    
    // Handle file send mode or JS changed
    Espruino.addProcessor("sendModeChanged", function(_, callback) {
      if (activeFile>=0 && activeFile<files.length) {
        files[activeFile].storageName = Espruino.Config.SAVE_STORAGE_FILE;
        files[activeFile].sendMode = Espruino.Config.SAVE_ON_SEND;
        saveFileConfig();
      }
      callback(_);
    });
    Espruino.addProcessor("jsCodeChanged", function(data, callback) {
      if (activeFile>=0 && activeFile<files.length) {
        files[activeFile].contents = data.code;
        if(typeof window !== 'undefined' && window.localStorage)
          window.localStorage.setItem(`FILE${activeFile}_CODE`, data.code);
      }
      callback(data);
    });
    // get code from our config area at bootup
    Espruino.addProcessor("initialised", function(data,callback) {
      loadFileConfig();
      updateFileTabs();

      callback(data);
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
    // we need to update the file list
    if (activeFile>=0 && activeFile<files.length) {
      files[activeFile].fileName = filename;    
      updateFileTabs();
      saveFileConfig();
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
      window.showOpenFilePicker({types: [{description:currentFile.description, accept: currentFile.mimeTypes}]}).
      then(function(fileHandles) {
        var fileHandle = fileHandles[0];
        if (fileHandle.name) {
          setCurrentFileName(fileHandle.name);
        }
        currentFile.handle = fileHandle;
        readFileContents(currentFile);
      });
    } else if (("undefined"!=typeof chrome) && chrome.fileSystem) {
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
      setCurrentFileName(name);
    });
  }

  Espruino.Core.File = {
    init : init
  };
}());
