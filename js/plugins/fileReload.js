/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  A button to reload the last loaded file
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  /* THIS IS BROKEN - PRs welcome :) */
  /*

  var icon;

  function init() {
    Espruino.Core.Config.add("SHOW_RELOAD_ICON", {
      section : "General",
      name : "File Reload Icon",
      description : "Show an icon that allows you to reload the contents of a file that you just opened.",
      type : "boolean",
      defaultValue : false,
      onChange : function(newValue) { showIcon(newValue); }
    });

    showIcon(Espruino.Config.SHOW_RELOAD_ICON);
  }

  function showIcon(show) {
    if (show) {
      icon = Espruino.Core.App.addIcon({
        id: "reloadfile",
        icon: "refresh",
        title : "Reload File",
        order: 300,
        area: {
          name: "code",
          position: "top"
        },
        click: reloadFile
      });
    } else {
      if (icon!==undefined) icon.remove();
    }
  }

  function reloadFile() {
    if (document.getElementById('fileLoader').value=="")
      $('#fileLoader').click();
    else
      $('#fileLoader').change();
  };

  Espruino.Plugins.FileReload = {
    init : init,
  };*/
}());
