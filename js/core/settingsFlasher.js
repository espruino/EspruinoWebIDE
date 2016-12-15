/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Settings Page for the Espruino Flasher
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  function init() {
    Espruino.Core.Config.addSection("Flasher", {
      description : "This allows you to update the Espruino Firmware that is on your board",
      sortOrder : 10000,
      getHTML : function(callback) {
        $.get("data/settings_flasher.html", function(data) {
          callback(data);

          // Set up warning
          var chromeVer = navigator.userAgent.replace(/.*Chrome\/([0-9]*).*/,"$1");
          if (chromeVer < 32) {
            // 32 should work, but if they're going to upgrade let's suggest 33 :)
            var info = "Your Chrome version is "+chromeVer+". Please upgrade it to 33 or newer before trying to flash your Espruino board."
            $(".flash_info").css("color","red").html(info);
          }

          // Start button
          $('.flash_start').click( function() {
            Espruino.Core.App.closePopup();
            Espruino.Core.MenuFlasher.showFlasher();
          });
          // Advanced start
          $('.flash_start_advanced').click( function() {
            var url = $('.flash_url').val();
            if (url!="") {
              Espruino.Core.App.closePopup();
              Espruino.Core.MenuFlasher.showFlasher( url );
            }
          });
        });
      }
    });
  }

  function startFlashing() {

  }

  Espruino.Core.SettingsFlasher = {
    init : init,
  };
}());
