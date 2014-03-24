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
    Espruino.Core.Config.add("UI_MODE", {
      section : "General",
      name : "UI Mode",
      description : "Change the display density of the UI.",
      type : {"normal":"Normal", "compact":"Compact"},
      defaultValue : "Normal", 
      onChange :setUiMode
    });
    
    setUiMode(Espruino.Config.UI_MODE);
  }
  
  function setUiMode(mode) {
    if(mode == "compact")
      $("body").addClass("compact");
    else
      $("body").removeClass("compact");
  }
  
  Espruino.Plugins.UiMode = {
    init : init,
  };
}());