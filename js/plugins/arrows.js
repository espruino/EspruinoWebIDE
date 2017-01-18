/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Plugin that adds arrow icons
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  function init() {
    if (Espruino.Core.Utils.isAppleDevice())
      addIcons();
  }

  function addIcons() {
    Espruino.Core.App.addIcon({
      id: "lastcommand",
      icon: "up",
      title : "Last Command",
      order: 300,
      area: {
        name: "terminal",
        position: "bottom"
      },
      click: function() { sendCommand(String.fromCharCode(27,91,65)); }
    });
    Espruino.Core.App.addIcon({
      id: "nextcommand",
      icon: "down",
      title : "Next Command",
      order: 400,
      area: {
        name: "terminal",
        position: "bottom"
      },
      click: function() { sendCommand(String.fromCharCode(27,91,66)); }
    });
  }

  function sendCommand(s) {
    Espruino.Core.Terminal.typeCharacters(s);
  }

  Espruino.Plugins.Arrows = {
    init : init,
  };
}());
