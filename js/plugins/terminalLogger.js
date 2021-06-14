/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  An Example Plugin
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  var icon;
  var log = [];
  var logStarted = false;

  function init() {
    Espruino.Core.Config.add("SHOW_TERMINAL_LOGGER_ICON", {
      section : "General",
      name : "Terminal Log Icon",
      description : "Show an icon in the terminal window that allows you to record the contents of the terminal to a file",
      type : "boolean",
      defaultValue : false,
      onChange : function(newValue) { showIcon(newValue); }
    });
    Espruino.Core.Config.add("TERMINAL_LOGGER_SAVE_TO_LOCALSTORAGE", {
      section : "General",
      name : "Terminal Log - save to localstorage",
      description : "Save the terminal log to localstorage?",
      type : "boolean",
      defaultValue : false,
      onChange : function(newValue) { if(newValue && !window.localStorage) { Espruino.Core.Notifications.error("Can't access localStorage!"); Espruino.Config.set("TERMINAL_LOGGER_SAVE_TO_LOCALSTORAGE", false); } }
    });
    
    if (Espruino.Config.TERMINAL_LOGGER_SAVE_TO_LOCALSTORAGE && window.localStorage) {
      let logString = window.localStorage.getItem("TERMINAL_LOGGER_STORAGE");
      if (logString) {
        try {
          let parsed = JSON.parse(logString);
          if(Array.isArray(parsed)){
            log = parsed;
            logStarted = true;
          } else {
            // shouldn't happen, but...
            Espruino.Core.Notifications.error("Log from localStorage is not an array?!");
          }
        } catch (error) {
          Espruino.Core.Notifications.error("Couldn't parse log from localStorage! \n" + error);
          console.error("Couldn't parse log from localStorage!", error, logString);
        }
      }
    }
    showIcon(Espruino.Config.SHOW_TERMINAL_LOGGER_ICON);
    Espruino.addProcessor("terminalNewLine", function(line, callback) {
      if (logStarted) {
        log.push(line);
        if(Espruino.Config.TERMINAL_LOGGER_SAVE_TO_LOCALSTORAGE && window.localStorage) 
          window.localStorage.setItem("TERMINAL_LOGGER_STORAGE", JSON.stringify(log)); 
        icon.setInfo(getLogStateMessage());
      }
      callback(line);
    });
  }

  function getLogStateMessage() {
    if (logStarted) {
      return "&#x1F534; "+log.length;
    } else {
      if (log.length) return "&#x2B55; "+log.length;
      else return "&#x2B55; IDLE";
    }
  }

  function showIcon(show) {
    if (icon!==undefined) {
      icon.remove();
      icon = undefined;
    }
    if (show) {
      icon = Espruino.Core.App.addIcon({
        id: "termLog",
        icon: "log",
        title : "Terminal Logging",
        //order: -90,
        area: {
          name: "terminal",
          position: "top"
        },
        click: showMenu,
        info : getLogStateMessage()
      });
    }
  }

  function showMenu() {
    var buttons = [];
    if (logStarted) {
      buttons.push({ name:"Stop", callback : function() {
        logStarted = false;
        icon.setInfo(getLogStateMessage());
        popup.close();
      }});
    } else {
      buttons.push({ name:"Start", callback : function() {
        logStarted = true;
        icon.setInfo(getLogStateMessage());
        popup.close();
      }});
    }
    if (log.length) {
      buttons.push({ name:"Save", callback : function() {
        Espruino.Core.Utils.fileSaveDialog(log.join("\r\n"), "log.txt", function() {
          icon.setInfo(getLogStateMessage());
          popup.close();
        });
      }});
      buttons.push({ name:"Clear", callback : function() {
        log = [];
        if(Espruino.Config.TERMINAL_LOGGER_SAVE_TO_LOCALSTORAGE && window.localStorage)
          window.localStorage.removeItem("TERMINAL_LOGGER_STORAGE");
        icon.setInfo(getLogStateMessage());
        popup.close();
      }});
    }
    var popup = Espruino.Core.App.openPopup({
      title: "Terminal Logging",
      padding: true,
      contents: `<p>Logging allows you to store the data from the terminal into a file.</p>
<p>You currently have ${log.length} lines recorded</p>`,
      position: "center",
      buttons : buttons
    });
  }

  Espruino.Plugins.TerminalLogger = {
    init : init,
  };
}());
