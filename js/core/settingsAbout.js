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
            callback(data);
            $(".webide_version").html("Web IDE version "+version);
            var html;
            var strData = {};
            if (Object.keys(Espruino.Core.Env.getBoardData()).length > 0) {
              var d = Espruino.Core.Env.getBoardData();
              for (var k in d) {
                var v = d[k];
                if ("string" != typeof v)
                  v = JSON.stringify(v);
                if (v.length>80) v=v.substr(0,77)+" ...";
                strData[k] = v;
              }
              html = Espruino.Core.Utils.htmlTable(strData);
            } else
              html = "<p>No board information available. Please connect to an Espruino board first.</p>";
            $('.board_info').html( html );
          });
          $.get("PATREON.md", function(data) {
            $(".patreon").html(Espruino.Core.Utils.markdownToHTML(data));
          });
        }
      });
    });
  }

  Espruino.Core.SettingsAbout = {
    init : init,
  };
}());
