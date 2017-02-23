/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  'Console' Settings Page showing console.log output
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  var MAX_LINES = 100;
  var lines = [];
  var linesClipped = 0;
  function doLog(prefix, args, postfix) {
    var str = Array.prototype.slice.apply(args).join(' ');
    lines.push(prefix+Espruino.Core.Utils.escapeHTML(str)+postfix);
    if (lines.length > MAX_LINES) {
      linesClipped += lines.lenth-MAX_LINES;
      lines = lines.slice(-MAX_LINES);
    }
  }

  var oldConsoleLog = console.log;
  console.log = function() {
    doLog('<span>', arguments, '</span>');
    oldConsoleLog.apply(console, arguments);
  }
  var oldConsoleWarn = console.warn;
  console.warn = function() {
    doLog('<span style="color:#ff9900">WARNING: ', arguments, '</span>');
    oldConsoleWarn.apply(console, arguments);
  }
  var oldConsoleError = console.error;
  console.error = function() {
    doLog('<span style="color:red">ERROR: ', arguments, '</span>');
    oldConsoleError.apply(console, arguments);
  }

  function init() {
    Espruino.Core.Config.addSection("Console", {
      description : "The last "+MAX_LINES+" lines of log messages made by the Web IDE. This is only useful when trying to debug potential problems with the IDE or Espruino board itself.",
      sortOrder : 10000,
      getHTML : function(callback) {
        var html = '<div class="console">';
        if (linesClipped) html += '<span style="color:#808080">'+linesClipped+' lines not displayed...</span><br/>'
        html += lines.join('<br/>\n');
        html += '</div>';
        callback(html);
      }
    });
  }

  Espruino.Core.SettingsConsole = {
    init : init,
  };
}());
