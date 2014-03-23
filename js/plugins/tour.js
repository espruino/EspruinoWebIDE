/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Guided tour
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {

    // When finding an icon, you need to make sure your plugin
    // comes after the inital icon module.
    var icon = Espruino.Core.App.findIcon("help");
    if(icon) {
      icon.addMenuItem({
          id: "tour",
          icon: "compass",
          title: "Tour",
          order: 2,
          click: function(){
            console.log("tour");
          }
        });
    }

    Espruino.addProcessor("initialised", function(data,callback) {
      

      /*
      $(".sidebar *[data-icon-order]").each(function(idx, itm){
        $(itm).attr("data-intro", $(this).attr("title")).attr("data-position", "right");
      });

      $(".toolbar *[data-icon-order]").each(function(idx, itm){
        $(itm).attr("data-intro", $(this).attr("title")).attr("data-position", "bottom");
      });

      $(".toolbar .toolbar__buttons--left *:first-child").attr("data-position", "right");
      */

    });
  }
  
  Espruino.Plugins.Tour = {
    init : init,
  };
}());