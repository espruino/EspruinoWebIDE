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
    /*Espruino.Core.Config.add("MAX_FOOBARS", {
      section : "Communications",
      name : "Foobar Count",
      description : "How many foobars?",
      type : "int",
      defaultValue : 20, 
      onChange : function(newValue) {  }
    });*/
    /*Espruino.Core.App.addIcon({ 
      name: "compass", 
      title : "Tour", 
      order: -96, 
      area: { 
        name: "toolbar", 
        position: "right" 
      } 
    }, function() {
      //$('body').chardinJs('start');
    });
*/

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