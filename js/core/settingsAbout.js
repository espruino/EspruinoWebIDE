/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  'About' Settings Page
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  function init() {
    Espruino.Core.Utils.getVersion(function(version){
      Espruino.Core.Config.addSection("About", {
        description : undefined,
        sortOrder : -1000,
        getHTML : function(callback) {
          $.get("data/settings_about.html", function(data) {
            // set contents
            callback(data);
            // IDE version
            $(".webide_version").html("Web IDE version "+version);
            // Board info
            var html;
            var strData = {};
            if (Object.keys(Espruino.Core.Env.getBoardData()).length > 0) {
              var d = Espruino.Core.Env.getBoardData();
              for (var k in d) {
                var v = d[k];
                if ("string" != typeof v)
                  v = ""+JSON.stringify(v);
                if (v.length>80) v=v.substr(0,77)+" ...";
                strData[k] = v;
              }
              html = Espruino.Core.HTML.htmlTable(strData);
            } else
              html = "<p>No board information available. Please connect to an Espruino board first.</p>";
            $('.board_info').html( html );
            // Patreon
            $.get("PATREON.md", function(data) {
              $(".patreon").html(Espruino.Core.HTML.markdownToHTML(data));
            });
            // Key Shortcuts
            var keyShortcuts = Espruino.Plugins.KeyShortcuts.getShortcutDescriptions();
            html = "<dl>";
            Object.keys(keyShortcuts).forEach(function(key) {
              html += "<dt>"+Espruino.Core.Utils.escapeHTML(key)+"</dt><dd>"+
                            Espruino.Core.Utils.escapeHTML(keyShortcuts[key])+"</dd>\n";
            });
            html += "</dl>";
            $('.shorcut_info').html( html );
          });          
        }
      });
    });
  }

  Espruino.Core.SettingsAbout = {
    init : init,
  };
}());
