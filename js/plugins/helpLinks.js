/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  The Espruino tutorial
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  function init() {

    var icon = Espruino.Core.App.findIcon("help");
    if(icon) {
      icon.addMenuItem({
        id: "forum",
        icon: "chat",
        title: "Forum",
        order: 100,
        click: function(){
          window.open("http://forum.espruino.com");
        }
      });
      icon.addMenuItem({
        id: "troubleshooting",
        icon: "book",
        title: "Troubleshooting",
        order: 100,
        click: function(){
          window.open("http://www.espruino.com/Troubleshooting");
        }
      });
    }
  }

  Espruino.Plugins.HelpLinks = {
    init : init,
  };
}());
