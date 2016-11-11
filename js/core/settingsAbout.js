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

  function getVersion(callback)
  {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('GET', 'manifest.json');
    xmlhttp.onload = function (e) {
        var manifest = JSON.parse(xmlhttp.responseText);
        callback(manifest.version);
    };
    xmlhttp.send(null);
  }

  function init() {

    getVersion(function(version){

      Espruino.Core.Config.addSection("About", {
        description : undefined,
        sortOrder : -1000,
        getHTML : function(callback) {
          $.get("data/settings_about.html", function(data) {
            callback(data);
            var html;
            if (Object.keys(Espruino.Core.Env.getBoardData()).length > 0) {
              var d = Espruino.Core.Env.getBoardData();
              for (var k in d) {
                if ("string" != typeof d[k])
                  d[k] = JSON.stringify(d[k]);
                if (d[k].length>80) d[k]=d[k].substr(0,77)+" ...";
              }
              html = Espruino.Core.Utils.htmlTable(d);
            } else
              html = "<p>Unable to get board information. Please connect to an Espruino board first.</p>";
            $('.board_info').html( html );
          });
        }
      });
    });
  }

  Espruino.Core.SettingsAbout = {
    init : init,
  };
}());
