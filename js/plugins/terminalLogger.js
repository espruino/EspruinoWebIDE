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
    showIcon(Espruino.Config.SHOW_TERMINAL_LOGGER_ICON);
    Espruino.addProcessor("terminalNewLine", function(line, callback) {
      if (logStarted) {
        log.push(line);
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
