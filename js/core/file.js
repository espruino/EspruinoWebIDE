/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  File Load/Save
 ------------------------------------------------------------------

 FIXME:

  * setOpenFileMode should be per file?
  * Seatch for Espruino.Core.EditorJavaScript.get/set* and remove/change what we can get away with

 **/
"use strict";
(function(){

  // how many millisecs between checking a file for modification?
  const WATCH_INTERVAL = 1000;
  // types of file we accept
  const FILETYPES = {
    all : { // used when opening a file dialog
      name:"code.js",
      description:"All supported files",
      mimeTypes : {"application/javascript": [".js", ".js"], "text/plain": [".txt"],"text/xml": [".xml"]},
    },
    js : {
      name:"code.js",
      icon:"📄",
      description:"JavaScript files",
      mimeTypes : {"application/javascript": [".js", ".js"], "text/plain": [".txt"]},
    },
    xml : {
      name:"code_blocks.xml",
      icon:"🧩",
      description:"Blockly XML files",
      mimeTypes : {"text/xml": [".xml"]},
    }
  };


  var iconOpenFile;
  var iconSaveFile;
  var iconViewMode;
  var iconTabSearch;
  // interval used when checking files for modification
  var watchInterval;
  // What we should do when clicking the 'openFile' button
  var openFileMode = "open"; // open, reload, watch, upload

  /* Files contains objects of this type:
      type :"js"/"xml"
      fileName : "Untitled.js"
      storageName : "", // file on Espruino device (Espruino.Config.SAVE_STORAGE_FILE)
      sendMode : 0,    // file on Espruino device (Espruino.Config.SAVE_ON_SEND)
      contents : "",   // the actual file contents
      handle           // file handle if loaded using file API
      editor           // if JS, this is from Espruino.Core.EditorJavaScript.createNewEditor
  */

  // List of currently open file tabs
  var files = [ ];
  var activeFile = 0; // index of active file in `files`
  var tabSearchOpen = false;
  var tabSearchQuery = "";
  var tabSearchInput;
  var tabDragIndex = -1;
  var tabMouseDrag;
  var tabDropIndex = -1;
  var tabDropAfter = false;
  var tabClickSuppressUntil = 0;
  var tabContextMenuEl;
  var tabContextMenuOutsideHandler;
  var tabContextMenuKeyHandler;

  /* options = {
    type : "js"/"xml"
    fileName : string
    isEmpty : bool
    contents : string
  }
  */
  function getDefaultFile(options) {
    options = options||{};
    if (!options.type) { // guess file type if not provided
      options.type="js";
      if (options.fileName && options.fileName.toLowerCase().endsWith(".xml"))
        options.type = "xml";
    }
    var file = {
      type : options.type, // "js"/"xml"
      fileName : "Untitled."+options.type, // file path in filesystem
      storageName : "", // file on Espruino device (Espruino.Config.SAVE_STORAGE_FILE)
      sendMode : Espruino.Core.Send.SEND_MODE_RAM,    // file on Espruino device (Espruino.Config.SAVE_ON_SEND)
      contents : "",    // the actual file contents
    };
    if (options.fileName) file.fileName = options.fileName;
    if (options.storageName) {
      file.storageName = options.storageName;
      file.sendMode = Espruino.Core.Send.SEND_MODE_STORAGE;
    }
    if (options.contents)
      file.contents = options.contents;
    else if (!options.isEmpty) {
      if (options.type=="js")
        file.contents = Espruino.Core.EditorJavaScript.DEFAULT_CODE;
      else if (options.type=="xml")
        file.contents = Espruino.Core.EditorBlockly.DEFAULT_CODE;
      else
        console.log("Espruino.Core.File unknown file type!");
    }

    return file;
  }

  // Sets the file and the editor up with the file's contents
  function setFileEditorContents(file, value, options) {
    options = options||{};
    file.contents = value;
    if (file.editor) {
      file.editor.setCode(value);

      // If `options.clearHistory`, then mark editor as clean with no
      // existing undo history. Using this for newly-created editors
      // will ensure that the first entry in the Undo history sets the
      // contents to `value` and not empty.
      if (options.clearHistory) file.editor.codeMirror.clearHistory();

    } else if (file.type=="xml") {
      Espruino.Core.EditorBlockly.setXML(value);
    }
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
    Espruino.Core.EditorJavaScript.hideAll();
    if (files[idx].type == "js") {
      Espruino.Core.EditorBlockly.setVisible(false);
      if (files[idx].editor==undefined) {
        // if we didn't have an editor, make one
        files[idx].editor = Espruino.Core.EditorJavaScript.createNewEditor();
        setFileEditorContents(files[idx], files[idx].contents, {clearHistory: true});
      } else {
        files[idx].editor.setVisible(true);
      }
      iconViewMode.setIcon("code");
      files[idx].editor.codeMirror.focus();
    } else { // xml
      Espruino.Core.EditorBlockly.setVisible(true);
      Espruino.Core.EditorBlockly.setXML(files[idx].contents);
      iconViewMode.setIcon("block");
    }

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
        var info = JSON.parse(window.localStorage.getItem(`FILE${idx}_INFO`));
        file.type = info.type;
        if (!file.type) file.type="js";
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
        type : file.type,
        fileName : file.fileName,
        storageName : file.storageName,
        sendMode : file.sendMode
      }));
    });
  }

  function createFileTabs() {
    var element = Espruino.Core.HTML.domElement('<div id="file_list"></div>');
    // add file tabs after left icons (so in the middle, before --right)
    document.querySelector(".toolbar__buttons--left").after(element);
  }

  function updateTabSearchState() {
    var iconEl = document.querySelector("#icon-tabSearch");
    if (iconEl) {
      iconEl.classList.toggle("tab-search-active", !!tabSearchQuery.trim());
      iconEl.classList.toggle("tab-search-open", !!tabSearchOpen);
    }
    var container = document.querySelector("#tab_search_container");
    if (container)
      container.classList.toggle("tab-search-container--open", !!tabSearchOpen);
  }

  function toggleTabSearch() {
    tabSearchOpen = !tabSearchOpen;
    if (!tabSearchOpen) {
      tabSearchQuery = "";
      if (tabSearchInput) tabSearchInput.value = "";
      updateFileTabs();
    }
    updateTabSearchState();
    if (tabSearchOpen && tabSearchInput)
      setTimeout(function() { tabSearchInput.focus(); }, 10);
  }

  function createTabSearch() {
    iconTabSearch = Espruino.Core.App.addIcon({
      id: "tabSearch",
      icon: "compass",
      title : "Search and Filter Tabs",
      order: -79,
      area: {
        name: "toolbar",
        position: "right"
      },
      click: function(e) {
        if (e) e.preventDefault();
        toggleTabSearch();
      }
    });

    var iconEl = document.querySelector("#icon-tabSearch");
    if (!iconEl || !iconEl.parentNode) return;

    var searchContainer = Espruino.Core.HTML.domElement(
      '<div id="tab_search_container" class="tab-search-container">'+
        '<input id="tab_search_input" class="tab-search-input" type="text" placeholder="Filter tabs..."/>'+
      '</div>');

    iconEl.parentNode.insertBefore(searchContainer, iconEl.nextSibling);
    tabSearchInput = searchContainer.querySelector("#tab_search_input");
    tabSearchInput.addEventListener("input", function() {
      tabSearchQuery = (tabSearchInput.value || "").trim();
      updateTabSearchState();
      updateFileTabs();
    });
    tabSearchInput.addEventListener("keydown", function(e) {
      if (e.key === "Escape") {
        tabSearchQuery = "";
        tabSearchInput.value = "";
        tabSearchOpen = false;
        updateTabSearchState();
        updateFileTabs();
      }
    });

    updateTabSearchState();
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
    // if we had an editor, remove the editor
    var file = files[idx];
    if (file.editor) {
      file.editor.remove();
      file.editor = undefined;
    }
    // remove the old one from the list
    files.splice(idx,1);
    if (activeFile>idx) activeFile--;
    // update the file list
    saveFileConfig();
    updateFileTabs();
  }

  function reorderFileTabs(fromIdx, toIdx) {
    if (fromIdx === toIdx) return;
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= files.length || toIdx >= files.length) return;

    var moved = files.splice(fromIdx, 1)[0];
    files.splice(toIdx, 0, moved);

    if (activeFile === fromIdx)
      activeFile = toIdx;
    else if (fromIdx < activeFile && toIdx >= activeFile)
      activeFile--;
    else if (fromIdx > activeFile && toIdx <= activeFile)
      activeFile++;

    saveFileConfig();
    updateFileTabs();
  }

  function renameFileTab(idx) {
    if (idx < 0 || idx >= files.length) return;
    var oldName = files[idx].fileName || "Untitled";
    var newName = window.prompt("Rename tab", oldName);
    if (newName === null) return;
    newName = (newName || "").trim();
    if (!newName || newName === oldName) return;

    files[idx].fileName = newName;
    if (idx === activeFile)
      setCurrentFileName(newName);
    else {
      saveFileConfig();
      updateFileTabs();
    }
  }

  function closeTabContextMenu() {
    if (tabContextMenuEl && tabContextMenuEl.parentNode)
      tabContextMenuEl.parentNode.removeChild(tabContextMenuEl);
    tabContextMenuEl = undefined;
    if (tabContextMenuOutsideHandler) {
      document.removeEventListener("mousedown", tabContextMenuOutsideHandler, true);
      document.removeEventListener("contextmenu", tabContextMenuOutsideHandler, true);
      tabContextMenuOutsideHandler = undefined;
    }
    if (tabContextMenuKeyHandler) {
      document.removeEventListener("keydown", tabContextMenuKeyHandler, true);
      tabContextMenuKeyHandler = undefined;
    }
  }

  function openTabContextMenu(idx, x, y) {
    if (idx < 0 || idx >= files.length) return;
    closeTabContextMenu();

    tabContextMenuEl = Espruino.Core.HTML.domElement(
      '<div id="tab_context_menu" class="tab-context-menu">'+
        '<button type="button" class="tab-context-menu-item" data-action="rename">Rename Tab</button>'+
        '<button type="button" class="tab-context-menu-item tab-context-menu-item--danger" data-action="delete">Delete Tab</button>'+
      '</div>'
    );
    tabContextMenuEl.addEventListener("click", function(e) {
      var item = e.target.closest(".tab-context-menu-item");
      if (!item) return;
      var action = item.getAttribute("data-action");
      closeTabContextMenu();
      if (action === "rename")
        renameFileTab(idx);
      else if (action === "delete")
        closeFileTab(idx);
    });
    tabContextMenuEl.addEventListener("contextmenu", function(e) {
      e.preventDefault();
    });
    document.body.appendChild(tabContextMenuEl);

    var menuRect = tabContextMenuEl.getBoundingClientRect();
    var left = Math.min(x, window.innerWidth - menuRect.width - 8);
    var top = Math.min(y, window.innerHeight - menuRect.height - 8);
    tabContextMenuEl.style.left = Math.max(8, left) + "px";
    tabContextMenuEl.style.top = Math.max(8, top) + "px";

    tabContextMenuOutsideHandler = function(e) {
      if (!tabContextMenuEl || tabContextMenuEl.contains(e.target)) return;
      closeTabContextMenu();
    };
    tabContextMenuKeyHandler = function(e) {
      if (e.key === "Escape") closeTabContextMenu();
    };
    document.addEventListener("mousedown", tabContextMenuOutsideHandler, true);
    document.addEventListener("contextmenu", tabContextMenuOutsideHandler, true);
    document.addEventListener("keydown", tabContextMenuKeyHandler, true);
  }

  function clearTabDropIndicators() {
    var tabs = document.querySelectorAll("#file_list .file_list-tab");
    tabs.forEach(function(tab) {
      tab.classList.remove("file_list-tab--drop-before");
      tab.classList.remove("file_list-tab--drop-after");
      tab.classList.remove("file_list-tab--drop-target");
    });
    tabDropIndex = -1;
    tabDropAfter = false;
  }

  function styleTabGhost(ghostEl, sourceEl) {
    var style = window.getComputedStyle(sourceEl);
    ghostEl.style.display = style.display;
    ghostEl.style.position = "fixed";
    ghostEl.style.margin = "0";
    ghostEl.style.paddingTop = style.paddingTop;
    ghostEl.style.paddingRight = style.paddingRight;
    ghostEl.style.paddingBottom = style.paddingBottom;
    ghostEl.style.paddingLeft = style.paddingLeft;
    ghostEl.style.borderTopWidth = style.borderTopWidth;
    ghostEl.style.borderRightWidth = style.borderRightWidth;
    ghostEl.style.borderBottomWidth = style.borderBottomWidth;
    ghostEl.style.borderLeftWidth = style.borderLeftWidth;
    ghostEl.style.borderTopStyle = style.borderTopStyle;
    ghostEl.style.borderRightStyle = style.borderRightStyle;
    ghostEl.style.borderBottomStyle = style.borderBottomStyle;
    ghostEl.style.borderLeftStyle = style.borderLeftStyle;
    ghostEl.style.borderTopColor = style.borderTopColor;
    ghostEl.style.borderRightColor = style.borderRightColor;
    ghostEl.style.borderBottomColor = style.borderBottomColor;
    ghostEl.style.borderLeftColor = style.borderLeftColor;
    ghostEl.style.borderTopLeftRadius = style.borderTopLeftRadius;
    ghostEl.style.borderTopRightRadius = style.borderTopRightRadius;
    ghostEl.style.borderBottomLeftRadius = style.borderBottomLeftRadius;
    ghostEl.style.borderBottomRightRadius = style.borderBottomRightRadius;
    ghostEl.style.backgroundColor = style.backgroundColor;
    ghostEl.style.color = style.color;
    ghostEl.style.fontSize = style.fontSize;
    ghostEl.style.lineHeight = style.lineHeight;
    ghostEl.style.whiteSpace = style.whiteSpace;
    ghostEl.style.boxSizing = style.boxSizing;
    ghostEl.style.pointerEvents = "none";
    ghostEl.style.zIndex = "4500";
  }

  function updateTabDropIndicatorFromX(clientX) {
    var tabs = Array.from(document.querySelectorAll("#file_list .file_list-tab")).filter(function(tab) {
      return parseInt(tab.getAttribute("fileIndex")) !== tabDragIndex;
    });
    if (!tabs.length) {
      clearTabDropIndicators();
      return;
    }

    var targetTab = tabs[tabs.length - 1];
    var dropAfter = true;
    for (var i = 0; i < tabs.length; i++) {
      var rect = tabs[i].getBoundingClientRect();
      if (clientX < rect.left + rect.width / 2) {
        targetTab = tabs[i];
        dropAfter = false;
        break;
      }
    }

    clearTabDropIndicators();
    if (dropAfter)
      targetTab.classList.add("file_list-tab--drop-after");
    else
      targetTab.classList.add("file_list-tab--drop-before");
    tabDropIndex = parseInt(targetTab.getAttribute("fileIndex"));
    tabDropAfter = dropAfter;
  }

  function endTabMouseDrag(options) {
    options = options || {};
    if (!tabMouseDrag) return;

    var wasDragging = !!tabMouseDrag.dragging;
    var fromIdx = tabMouseDrag.fromIdx;
    var targetIdx = tabDropIndex;
    var dropAfter = tabDropAfter;

    document.removeEventListener("mousemove", onTabMouseMove, true);
    document.removeEventListener("mouseup", onTabMouseUp, true);

    if (tabMouseDrag.sourceEl)
      tabMouseDrag.sourceEl.classList.remove("file_list-tab--dragging");
    if (tabMouseDrag.ghostEl && tabMouseDrag.ghostEl.parentNode)
      tabMouseDrag.ghostEl.parentNode.removeChild(tabMouseDrag.ghostEl);

    tabMouseDrag = undefined;
    tabDragIndex = -1;
    clearTabDropIndicators();

    if (!wasDragging) return;
    tabClickSuppressUntil = Date.now() + 200;

    if (options.reorder && !isNaN(fromIdx) && !isNaN(targetIdx)) {
      var toIdx = dropAfter ? targetIdx + 1 : targetIdx;
      if (toIdx > fromIdx) toIdx--;
      if (toIdx < 0) toIdx = 0;
      if (toIdx >= files.length) toIdx = files.length - 1;
      reorderFileTabs(fromIdx, toIdx);
    }
  }

  function onTabMouseMove(e) {
    if (!tabMouseDrag) return;

    var dx = e.clientX - tabMouseDrag.startX;
    var dy = e.clientY - tabMouseDrag.startY;
    if (!tabMouseDrag.dragging) {
      // Start dragging only when horizontal movement is dominant.
      if (Math.abs(dx) < 4 || Math.abs(dx) < Math.abs(dy)) return;

      tabMouseDrag.dragging = true;
      tabDragIndex = tabMouseDrag.fromIdx;
      tabMouseDrag.sourceEl.classList.add("file_list-tab--dragging");
      closeTabContextMenu();

      var ghostEl = tabMouseDrag.sourceEl.cloneNode(true);
      ghostEl.classList.add("file_list-tab--ghost");
      ghostEl.classList.remove("active");
      ghostEl.classList.remove("inactive");
      styleTabGhost(ghostEl, tabMouseDrag.sourceEl);
      ghostEl.style.width = tabMouseDrag.sourceRect.width + "px";
      ghostEl.style.top = tabMouseDrag.sourceRect.top + "px";
      ghostEl.style.left = (e.clientX - tabMouseDrag.offsetX) + "px";
      document.body.appendChild(ghostEl);
      tabMouseDrag.ghostEl = ghostEl;
    }

    if (!tabMouseDrag.dragging) return;
    e.preventDefault();

    var newLeft = e.clientX - tabMouseDrag.offsetX;
    var maxLeft = window.innerWidth - tabMouseDrag.sourceRect.width;
    if (newLeft < 0) newLeft = 0;
    if (newLeft > maxLeft) newLeft = maxLeft;
    tabMouseDrag.ghostEl.style.left = newLeft + "px";

    updateTabDropIndicatorFromX(e.clientX);
  }

  function onTabMouseUp() {
    endTabMouseDrag({reorder:true});
  }

  // Create a new tab, see getDefaultFile for options
  function createNewTab(options) {
    options = options||{};
    var file = getDefaultFile(options);

    files.push(file);
    // Set active tab - this saves and updates the file tab list
    setActiveFile(files.length-1);
    return file;
  }

  function showNewFileDialog() {
    var popup = Espruino.Core.App.openPopup({
      title: "New file...",
      contents: Espruino.Core.HTML.domList([
        {
          icon : "icon-code",
          title : "JavaScript",
          callback : function() {
            popup.close();
            createNewTab({type:"js"});
          }
        },
        {
          icon : "icon-block",
          title : "Blockly",
          callback : function() {
            popup.close();
            createNewTab({type:"xml"});
          }
        }
      ]),
      position: "center",
    });
  }

  function updateFileTabs() {
    closeTabContextMenu();
    var fileList = document.querySelector("#file_list");
    var filter = tabSearchQuery.toLowerCase();
    var visibleFiles = files.map((f, idx) => ({f:f, idx:idx})).filter(function(file) {
      if (!filter) return true;
      var name = file.f.fileName || "Untitled";
      return name.toLowerCase().indexOf(filter) >= 0;
    });

    fileList.innerHTML = visibleFiles.map( (entry) => {
      var f = entry.f;
      var idx = entry.idx;
      let active = activeFile==idx;
      return `<span class="file_list-tab ${active?'active':'inactive'}" fileIndex="${idx}">${FILETYPES[f.type].icon} ${f.fileName||"Untitled"}${active?'&nbsp;<span class="close">&#10005;</span>':""}</span>`
    }).join("") + `<span class="file_list-new">+</span>`;
    var node = fileList.firstChild;
    while (node) {
      node.addEventListener("click", function(e) {
        e.preventDefault();
        if (Date.now() < tabClickSuppressUntil) return;
        if (e.target.classList.contains("close")) {
          closeFileTab(parseInt(this.getAttribute("fileIndex")));
        } else if (e.target.classList.contains("file_list-new")) {
          showNewFileDialog();
        } else if (this.classList.contains("file_list-tab")) {
          setActiveFile(parseInt(this.getAttribute("fileIndex")));
        } else
          console.log("Unexpected element clicked", e.target);
      });

      if (node.classList.contains("file_list-tab")) {
        node.addEventListener("contextmenu", function(e) {
          e.preventDefault();
          openTabContextMenu(parseInt(this.getAttribute("fileIndex")), e.clientX, e.clientY);
        });

        node.addEventListener("mousedown", function(e) {
          if (e.button !== 0) return;
          if (e.target.classList.contains("close")) return;
          if (tabMouseDrag) endTabMouseDrag();

          var rect = this.getBoundingClientRect();
          tabMouseDrag = {
            sourceEl : this,
            sourceRect : rect,
            fromIdx : parseInt(this.getAttribute("fileIndex")),
            startX : e.clientX,
            startY : e.clientY,
            offsetX : e.clientX - rect.left,
            dragging : false,
            ghostEl : undefined
          };
          tabDropIndex = -1;
          tabDropAfter = false;
          document.addEventListener("mousemove", onTabMouseMove, true);
          document.addEventListener("mouseup", onTabMouseUp, true);
        });
      }
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
        loadFile([FILETYPES.all,FILETYPES.js,FILETYPES.xml]);
      }
    };
    // Only add extra options if showOpenFilePicker is available
    if ((typeof window.showOpenFilePicker === 'function') && !Espruino.Core.Utils.isCrossOriginSubframe()) {
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
    // Setup code mode (js/blockly) button
    iconViewMode = Espruino.Core.App.addIcon({
      id: "code",
      icon: "code",
      title : "Switch between Code and Graphical Designer",
      order: 0,
      area: {
        name: "code",
        position: "bottom"
      },
      click: function() {
        var switchToType = (files[activeFile].type == "xml") ? "js" : "xml";
        var idx = files.findIndex(f => f.type==switchToType);
        if (idx>=0) {
          // we found one! switch
          setActiveFile(idx);
        } else {
          // else we didn't find one - make a new tab
          createNewTab({type:switchToType});
        }
      }
    });
    // Create the tabs showing what files we have
    createFileTabs();
    createTabSearch();
    // Handle file send mode or JS changed
    Espruino.addProcessor("sendModeChanged", function(_, callback) {
      if (activeFile>=0 && activeFile<files.length) {
        var f = files[activeFile];
        f.storageName = Espruino.Config.SAVE_STORAGE_FILE;
        f.sendMode = Espruino.Config.SAVE_ON_SEND;
        if (f.storageName!="" && f.type=="js" && f.fileName=="Untitled.js") {
          f.fileName = f.storageName;
          if (!f.fileName.endsWith(".js"))
            f.fileName += ".js";
          updateFileTabs();
        }
        saveFileConfig();
      }
      callback(_);
    });
    Espruino.addProcessor("jsCodeChanged", function(data, callback) {
      var file = files.find(f=>f.editor == data.editor);
      if (file) {
        file.contents = data.code;
        if(typeof window !== 'undefined' && window.localStorage)
          window.localStorage.setItem(`FILE${activeFile}_CODE`, data.code);
      } else
        console.warn("Got jsCodeChanged but can't match it to an editor");
      callback(data);
    });
    Espruino.addProcessor("xmlCodeChanged", function(data, callback) {
      if (files[activeFile] && files[activeFile].type=="xml") {
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
        files.forEach((file) => {readFileContents(file)});
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

  function getFilePickerTypes(fileTypes) {
    return fileTypes.map(fileType => ({description:fileType.description, accept: fileType.mimeTypes}));
  }

  function loadFile(fileTypes) {
    /* if clicking the button should just reload the existing file, do that */
    if (openFileMode == "reload" && files[activeFile].handle) {
      readFileContents(files[activeFile]);
      return;
    }
    // Otherwise load a new file
    if ((typeof window.showOpenFilePicker === 'function')  && !Espruino.Core.Utils.isCrossOriginSubframe()) {
      window.showOpenFilePicker({types: getFilePickerTypes(fileTypes)}).
      then(function(fileHandles) {
        fileHandles.forEach(fileHandle => {
          if (!fileHandle.name) return;
          var file = createNewTab({fileName:fileHandle.name, isEmpty:true});
          file.handle = fileHandle;
          readFileContents(file, {clearHistory: true});
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
            setFileEditorContents(file, convertFromOS(e.target.result), {clearHistory: true});
          };
          reader.onerror = function() {
            Espruino.Core.Notifications.error("Error Loading", true);
          };
          reader.readAsText(file);
        });
      });
    } else {
      var mimeTypes = { };
      fileTypes.forEach( fileType => {
        mimeTypes = Object.assign(mimeTypes, fileType.mimeTypes);
      });
      var mimeTypeList = Object.values(mimeTypes) + "," + Object.keys(mimeTypes);
      Espruino.Core.Utils.fileOpenDialog({id:"code",type:"text",mimeType:mimeTypeList}, function(data, mimeType, fileName) {
        var file = createNewTab({fileName:fileName, isEmpty:true});
        setFileEditorContents(file, convertFromOS(data), {clearHistory: true});
      });
    }
  }


  // read a file from window.showOpenFilePicker
  function readFileContents(fileToLoad, options) {
    options = options||{};
    if (options.clearHistory === undefined) options.clearHistory = false;

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
      setFileEditorContents(fileToLoad, convertFromOS(contents), {clearHistory: options.clearHistory});
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
    if (window.showSaveFilePicker && !Espruino.Core.Utils.isCrossOriginSubframe()) {
      var writable, handle;
       window.showSaveFilePicker({
          suggestedName:fileToSave.fileName,
          types: getFilePickerTypes([FILETYPES[fileToSave.type||"js"]])
        }).
         then(h =>  {
          handle = h;
          return handle.createWritable()
         }).
         then(w => {
          writable = w;
          var fileBlob = new Blob([fileToSave.contents], {type: "text/plain"});
          return writable.write(fileBlob);
         }).
         then(() => writable.close()).
         then(() => {
           if (files[activeFile])
             files[activeFile].handle = handle;
           if (handle.name) setCurrentFileName(handle.name);
         });
       return
    }

    Espruino.Core.Utils.fileSaveDialog(convertToOS(fileToSave.contents), fileToSave.fileName, function(name) {
      setCurrentFileName(name);
    });
  }

  // Set the editor's JS code (and if it doesn't exist, make a new tab)
  function setJSCode(code, options) {
    options = options||{};
    if (!options.fileName)
      options.fileName = "code.js";
    var file = files.find(file => file.fileName==options.fileName);
    let newEditorOpened = false;
    if (!file) {
      file = createNewTab({
        type:"js",
        fileName:options.fileName,
        storageName:options.isStorageFile ? options.fileName : undefined,
        isEmpty:true,
        contents:code});
      newEditorOpened = true;
    } else {
      if (files[activeFile] != file)
        setActiveFile(files.indexOf(file));
      setFileEditorContents(file, code, {clearHistory: newEditorOpened});
    }
  }

  function getCurrentCode() {
    var file = files[activeFile];
    if (!file) return;
    if (file.type=="xml") // blockly code needs to be translated to JS first!
      return Espruino.Core.EditorBlockly.getCode();
    return file.contents;
  }

  function getEspruinoCode(callback) {
    Espruino.callProcessor("transformForEspruino", getCurrentCode(), callback);
  }

  function isInBlockly() {
    return files[activeFile] && files[activeFile].type=="xml";
  }

  function focus() {
    var file = files[activeFile];
    if (!file) return;
    if (file.type=="xml")
      document.querySelector("#divblockly").focus();
    else if (file.editor)
      file.editor.codeMirror.focus();
  }

  function switchTo(fileType) {
    var file = files.find(file => file.type==fileType);
    if (!file)
      file = createNewTab({type:fileType});
    if (files[activeFile] != file)
      setActiveFile(files.indexOf(file));
  }

  Espruino.Core.File = {
    init : init,
    getActiveFile : () => files[activeFile], // Get the object representing the currently active file
    showFile : file=> setActiveFile(files.indexOf(file)), // Given a file object (from getActiveFile), make sure it's showing
    getCurrentCode : getCurrentCode, // Get the code for the currently active tab
    getEspruinoCode : getEspruinoCode, // Get the current code in a form that is ready to send to Espruino
    setJSCode : setJSCode, // (code, {fileName...,}}) called when the contents of the code window is to be set (eg from a URL)
    isInBlockly : isInBlockly, // are we currently showing a Blockly window
    focus : focus, // give focus to the current editor
    switchToCode: () => switchTo("js"), // switch to show JS code - if it doesn't exist, make a tab
    switchToBlockly: () => switchTo("xml") // switch to show XML code - if it doesn't exist, make a tab
  };
}());
