/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Onscreen buttons for Android Phones/etc
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  function init() {
    if (!/Android/i.test(navigator.userAgent)) return; // only run on Android

    Espruino.Core.App.addIcon({
      id: "uparrow",
      icon: "upkey",
      title : "Up Arrow",
      area: {
        name: "terminal",
        position: "bottom"
      },
      click: function(){
        Espruino.Core.Terminal.typeCharacters(String.fromCharCode(27,91,65));
        Espruino.Core.Terminal.focus(); // don't lose the onscreen keyboard
      }
    });
    Espruino.Core.App.addIcon({
      id: "downarrow",
      icon: "downkey",
      title : "Down Arrow",
      area: {
        name: "terminal",
        position: "bottom"
      },
      click: function(){
        Espruino.Core.Terminal.typeCharacters(String.fromCharCode(27,91,66));
        Espruino.Core.Terminal.focus(); // don't lose the onscreen keyboard
      }
    });
    Espruino.Core.App.addIcon({
      id: "tabkey",
      icon: "tabkey",
      title : "Tab Key",
      area: {
        name: "terminal",
        position: "bottom"
      },
      click: function(){
        Espruino.Core.Terminal.typeCharacters("\x09");
        Espruino.Core.Terminal.focus(); // don't lose the onscreen keyboard
      }
    });
  }

  Espruino.Plugins.Android = {
    init : init,
  };
}());