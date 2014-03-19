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
  
  function init() {
    Espruino.Core.Layout.addIcon({ name: "settings", title : "Settings", order: 0, area: "right" }, function() {
      Espruino.Core.Layout.addPopup("Hello", {
        title: "Settings",
      });
    });
  }
  
  Espruino.Core.MenuSettings = {
    init : init,
  };
}());