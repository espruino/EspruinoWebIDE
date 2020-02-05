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
    "Ctrl + U" : "ICON_DEPLOY"
  };
/* ACTIONS:
     Are either implemented in `action` function.
     or `ICON_` prefixed actions, eg `ICON-DEPLOY` will 'click' the relevant icon
*/

  var BUILTIN_SHORTCUTS = {
    "Ctrl + C / Cmd-C" : "Copy (simple drag and release copies from the Terminal Window)",
    "Ctrl + V / Cmd-V" : "Paste",

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
        console.log("Key Shortcut "+key+" => "+actionName);
        action(actionName);
      }
    });
  }

  function action(name, getDescription) {
    if (name.startsWith("ICON_")) {
      var iconid = "icon-" + name.substr(5).toLowerCase();
      var icon = document.getElementById(iconid);
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
    getShortcutDescriptions : getShortcutDescriptions // get a map of shortcut key -> description
  };
}());
