/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
   Check for the latest version of the board's software
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
    // Configuration
    Espruino.Core.Config.add("SERIAL_THROTTLE_SEND", {
      section : "Communications",
      name : "Throttle Send",
      description : "Throttle code when sending to Espruino? If you are experiencing lost characters when sending code from the Code Editor pane, this may help.",
      type : "boolean",
      defaultValue : false,
      onChange : function() { 
        checkEnv(Espruino.Core.Env.getData());
      }
    });
    
    // must be AFTER boardJSON
    Espruino.addProcessor("environmentVar", function(env, callback) {
      checkEnv(env);
      callback(env);
    }); 

    Espruino.addProcessor("flashComplete", function(env, callback) {

      var icon = Espruino.Core.App.findIcon("update");
      if(icon) icon.remove();

      callback(env);
    }); 

    Espruino.addProcessor("disconnected", function(env, callback) {
      var icon = Espruino.Core.App.findIcon("update");
      if(icon) icon.remove();
      
      callback(env);
    });
  }
  
  function checkEnv(env) {
    if (env!==undefined && 
        env.VERSION!==undefined &&
        env.info!==undefined &&
        env.info.binary_version!==undefined) {
      var tCurrent = env.VERSION;
      var tAvailable = env.info.binary_version;
      var vCurrent = Espruino.Core.Utils.versionToFloat(tCurrent);
      var vAvailable = Espruino.Core.Utils.versionToFloat(tAvailable);
      console.log("FIRMWARE: Current "+tCurrent+", Available "+tAvailable);
      
      if (vCurrent > 1.43 && env.CONSOLE=="USB") {
        console.log("Firmware >1.43 supports faster writes over USB");
        Espruino.Core.Serial.setSlowWrite(false);
      } else
        Espruino.Core.Serial.setSlowWrite(false);
      if (vAvailable > vCurrent && env.BOARD=="ESPRUINOBOARD") {
        console.log("New Firmware "+tAvailable+" available");

        Espruino.Core.App.addIcon({
          id:'update',
          icon: 'alert',
          title: 'New Firmware '+ tAvailable +' available. Click to update.',
          order: 999,
          cssClass: 'title-bar__button--alert',
          area: {
            name: "titlebar",
            position: "right"
          },
          click: function(){
            Espruino.Core.MenuSettings.show("Flasher");
          }
        });

        //Espruino.Core.Notifications.info('New Firmware '+ tAvailable +' available. <a class="flash_menu" style="cursor:pointer">Click here to update</a>');
        //$(".flash_menu").click(function() {
        //  Espruino.Core.MenuSettings.show("Flasher");
        //});
      }
     // $("#flashFirmwareUrl").val(env.info.binary_url);
    } 
  }
  
  Espruino.Plugins.VersionChecker = {
    init : init,
  };
}());