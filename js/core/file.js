/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  File Load/Save
 ------------------------------------------------------------------

 FIXME:

 How do we handle Blockly changing? Espruino.Core.EditorBlockly.getXML
 setOpenFileMode should be per file?
 Ideally we want separate codemirror instances
**/
"use strict";
(function(){

  // how many millisecs between checking a file for modification?
  const WATCH_INTERVAL = 1000;
  // types of file we accept
  const FILETYPES = {
    js : {
      name:"code.js",
      description:"JavaScript files",
      mimeTypes : {"application/javascript": [".js", ".js"], "text/plain": [".txt"]},
    },
    xml : {
      name:"code_blocks.xml",
      description:"Blockly XML files",
      mimeTypes : {"text/xml": [".xml"]},
    }
  };
    

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
      // handle - if loaded using file API
    };
  }

  // List of currently open file tabs
  var files = [ ];
  var activeFile = 0; // index of active file in `files`

  // Sets the file and the editor up with the file's contents
  function setFileEditorContents(file, value) {
    file.contents = value;
    Espruino.Core.EditorJavaScript.setCode(value);
    //currentXMLFile.setValue = Espruino.Core.EditorBlockly.setXML;    
  }
 
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
    setFileEditorContents(files[idx], files[idx].contents);
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
    if (files.length==0)
      files.push(getDefaultFile()); // add defualt file if no files
    if (newActiveFile<0 || newActiveFile>=files.length)
      newActiveFile = 0; // reset active file
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
    // update the file list
    saveFileConfig();
    updateFileTabs();
  }

  function createNewTab(options) {
    options = options||{};
    var file = getDefaultFile();
    if (options.fileName) file.fileName = options.fileName;
    if (options.isEmpty) file.contents = "";
    files.push(file);
    // Set active tab - this saves and updates the file tab list
    setActiveFile(files.length-1);
    return file;
  }

  function updateFileTabs() {
    var fileList = document.querySelector("#file_list");
    fileList.innerHTML = files.map( (f,idx) => {
      let active = activeFile==idx;
      return `<span class="file_list-tab ${active?'active':'inactive'}" fileIndex="${idx}">📄 ${f.fileName||"Untitled"}${active?'&nbsp;<span class="close">&#10005;</span>':""}</span>` 
    }).join("") + `<span class="file_list-new">+</span>`;
    var node = fileList.firstChild;
    while (node) {
      node.addEventListener("click", function(e) {
        e.preventDefault();
        if (e.target.classList.contains("close")) {
          closeFileTab(activeFile);
        } else if (e.target.classList.contains("file_list-new")) {
          createNewTab();
        } else if (e.target.classList.contains("file_list-tab")) {
          setActiveFile(parseInt(e.target.getAttribute("fileIndex")));
        } console.log("Unexpected element clicked", e.target);
      });
      node = node.nextSibling;
    }
  }


  function init() {
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
          loadFile(FILETYPES.xml);
        else
          loadFile(FILETYPES.js);
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
        saveFile(files[activeFile]);
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
        files.forEach(readFileContents);
      }, WATCH_INTERVAL);
    }
  }

  function setCurrentFileName(filename) {
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

  function loadFile(fileType) {
    /* if clicking the button should just reload the existing file, do that */
    if (openFileMode == "reload" && files[activeFile].handle) {
      readFileContents(files[activeFile]);
      return;
    }
    // Otherwise load a new file
    if (typeof window.showOpenFilePicker === 'function') {
      window.showOpenFilePicker({types: [{description:fileType.description, accept: fileType.mimeTypes}]}).
      then(function(fileHandles) {
        fileHandles.forEach(fileHandle => {
          if (!fileHandle.name) return;
          var file = createNewTab({fileName:fileHandle.name, isEmpty:true});
          file.handle = fileHandle;
          readFileContents(file);
        });
      });
    } else if (("undefined"!=typeof chrome) && chrome.fileSystem) {
      // Chrome Web App / NW.js
      chrome.fileSystem.chooseEntry({type: 'openFile'}, function(fileEntry) {
        if (!fileEntry) return;
        fileEntry.file(function(file) {
          var reader = new FileReader();
          reader.onload = function(e) {
            var file = createNewTab({fileName:fileEntry.name, isEmpty:true});
            setFileEditorContents(file, convertFromOS(e.target.result));
          };
          reader.onerror = function() {
            Espruino.Core.Notifications.error("Error Loading", true);
          };
          reader.readAsText(file);
        });
      });
    } else {
      var mimeTypeList = Object.values(fileType.mimeTypes) + "," + Object.keys(fileType.mimeTypes);
      Espruino.Core.Utils.fileOpenDialog({id:"code",type:"text",mimeType:mimeTypeList}, function(data, mimeType, fileName) {
        var file = createNewTab({fileName:fileName, isEmpty:true});
        setFileEditorContents(file, convertFromOS(data));        
      });
    }
  }


  // read a file from window.showOpenFilePicker
  function readFileContents(fileToLoad) {
    if (!fileToLoad.handle) {
      return;
    }

    var file;
    fileToLoad.handle.getFile().then(function(f) {
      file = f;
      // if file is newer, proceed to load it
      if (!fileToLoad.lastModified ||
          file.lastModified > fileToLoad.lastModified)
        return file.text();
      else
        return undefined;
    }).then(function(contents) {
      if (!contents) return;
      // if loaded, update editor
      fileToLoad.lastModified = file.lastModified;
      setFileEditorContents(file, convertFromOS(contents));
      if (openFileMode == "upload") {
        Espruino.Core.Notifications.info(new Date().toLocaleTimeString() + ": " + fileToLoad.name+" changed, uploading...");
        Espruino.Plugins.KeyShortcuts.action("icon-deploy");
      }
    });
  }

  function saveFile(fileToSave) {
    /* TODO: if fileToSave.handle, we could write direct to this
    file without the dialog. But then what do we do for 'save as'? The down-arrow
    next to the icon? */
    Espruino.Core.Utils.fileSaveDialog(convertToOS(fileToSave.contents), fileToSave.fileName, function(name) {
      setCurrentFileName(name);
    });
  }

  Espruino.Core.File = {
    init : init
  };
}());
