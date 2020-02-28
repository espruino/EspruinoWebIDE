/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Key shortcuts for IDE (the editor/etc often add their own)
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  var SHORTCUTS = {
    // Map key combination to an ACTION (below)
    "Ctrl + `" : "TOGGLE_TERMINAL_EDITOR",
    "Ctrl + O" : "icon-openFile",
    "Ctrl + S" : "icon-saveFile",
    "Ctrl + U" : "icon-deploy",
    "Shift + ENTER" : "UPLOAD_SELECTED"
  };
/* ACTIONS:
     Are either implemented in `action` function.
     or `icon-` prefixed actions, eg `icon-deploy` will 'click' the relevant icon
*/

  var BUILTIN_SHORTCUTS = {
    "Ctrl + C / Cmd + C" : "Copy (simple drag and release copies from the Terminal Window)",
    "Ctrl + V / Cmd + V" : "Paste",
    "Alt + ENTER" : "(In REPL) Create new line without executing",

    "Ctrl + F / Cmd-F" : "Start searching (in editor), Fullscreen (in terminal)",
    "Ctrl + G / Cmd-G" : "Find next",
    "Shift + Ctrl + G / Shift + Cmd-G" : "Find previous",
    "Shift + Ctrl + F / Cmd + Option +F" : "Replace",
    "Shift + Ctrl + R / Shift + Cmd + Option + F" : "Replace all",

    "Ctrl + Space" : "Autocomplete",
    "Ctrl + I" : "Find type at cursor",
    "Alt + ." : "Jump to definition (Alt-, to jump back)",
    "Ctrl + Q" : "Rename variable",
    "Ctrl + ." : "Select all occurrences of a variable",
  }

  function init() {
    window.addEventListener("keydown",function(e) {
      var key = (""+e.key).toUpperCase();
      if (e.shiftKey) key = "Shift + "+key;
      if (e.altKey) key = "Alt + "+key;
      if (e.ctrlKey) key = "Ctrl + "+key;
      if (e.metaKey) key = "Cmd + "+key;
      //console.log(key);
      var actionName = SHORTCUTS[key];
      if (actionName!==undefined) {
        e.preventDefault();
        console.log("Key Shortcut "+key+" => "+actionName);
        action(actionName);
      }
    });
  }

  function action(name, getDescription) {
    if (name.startsWith("icon-")) {
      var icon = document.getElementById(name);
      if (icon!==null) {
        if (getDescription) return icon.getAttribute("title");
        else icon.click();
        return;
      }
    }
    switch (name) {
      case "TOGGLE_TERMINAL_EDITOR":
        if(getDescription) return "Toggle between typing in the Terminal or Code Editor";
        if (Espruino.Core.Terminal.hasFocus())
          Espruino.Core.Code.focus();
        else
          Espruino.Core.Terminal.focus();
        break;
      case "UPLOAD_SELECTED":
        if(getDescription) return "Upload just the text that is selected in the editor pane";
        if (Espruino.Core.Code.isInBlockly()) return;
        var selectedCode = Espruino.Core.EditorJavaScript.getSelectedCode().trim();
        if (selectedCode) {
          Espruino.Core.MenuPortSelector.ensureConnected(function() {
            var old_RESET_BEFORE_SEND = Espruino.Config.RESET_BEFORE_SEND;
            /* No need to tweak SAVE_ON_SEND/etc because by calling
            writeToEspruino we skip the usual pipeline of code
            modifications. But maybe we shouldn't? Could then do
            compiled code/etc on demand too. */
            Espruino.Config.RESET_BEFORE_SEND = false;
            Espruino.Core.CodeWriter.writeToEspruino(selectedCode,function(){
              Espruino.Config.RESET_BEFORE_SEND = old_RESET_BEFORE_SEND;
            });
          });
        }
        break;
      default:
        console.log("keyShortcuts.js: Unknown Action "+JSON.stringify(name));
    }
  }

  function getShortcutDescriptions() {
    var desc = {};
    Object.keys(BUILTIN_SHORTCUTS).forEach(function(key) {
      desc[key] = BUILTIN_SHORTCUTS[key];
    });
    Object.keys(SHORTCUTS).forEach(function(key) {
      desc[key] = action(SHORTCUTS[key], true);
    });
    return desc;
  }

  Espruino.Plugins.KeyShortcuts = {
    init : init,
    action : action, // perform action, or using action("...",true) get the description
    getShortcutDescriptions : getShortcutDescriptions, // get a map of shortcut key -> description
    SHORTCUTS : SHORTCUTS, // public to allow shortcuts to be added easily
  };
}());
