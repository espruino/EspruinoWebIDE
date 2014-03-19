/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Settings Page for the Espruimno Flasher
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
    Espruino.Core.Config.addSection("Flasher", {
      description : "Writing a new version of Espruino onto the board",
      sortOrder : 10000,
      getHTML : function(callback) {      
        $.get("/data/settings_flasher.html", function(data) {
          callback(data);
          // Set up URL
          var env = Espruino.Core.Env.getData();
          if (env!==undefined &&
              env.info!==undefined &&
              env.info.binary_url!==undefined)
            $('.flash_url').val( env.info.binary_url );
          // Set up warning
          var chromeVer = navigator.userAgent.replace(/.*Chrome\/([0-9]*).*/,"$1");
          if (chromeVer < 31) {
            $(".flash_info").css("color","red").html("Your Chrome version is "+chromeVer+". Please upgrade it before trying to flash your Espruino board.");
          }          
          // Start button
          $('.flash_start').click( startFlashing );
        });
      }
    });
  }
  
  function writeFlashStatus(status) {
    Espruino.Core.Terminal.setExtraText(Espruino.Core.Terminal.getCurrentLine(), "<b>"+status+"</b>");
  }
  
  function startFlashing() {
    var url = $(".flash_url").val().trim();
    
    if (!Espruino.Core.Serial.isConnected()) {
      Espruino.Core.Status.setStatus("Must be connected first.");
      return;
    }
    
    if (url=="") {
      Espruino.Core.Status.setStatus("You must provide a firmware URL!");
      return;
    }
    
    Espruino.Core.Layout.closePopup();
    
    Espruino.Core.Flasher.flashDevice(url ,function (err) {
      Espruino.Core.Terminal.grabSerialPort();
      if (err) {
        Espruino.Core.Status.setStatus("Error Flashing.");        
        console.log(err);
        writeFlashStatus("ERROR FLASHING : "+err);
      } else {        
        Espruino.Core.Status.setStatus("Flashing Complete");
        writeFlashStatus("Flashing Completed Successfully");
      }
    });
    
  }
  
  Espruino.Core.SettingsFlasher = {
    init : init,
  };
}());