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
      description : "Throttle code when sending to Espruino?",
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
        Espruino.Core.Terminal.setExtraText(Espruino.Core.Terminal.getCurrentLine(), 
            "<b>New Firmware "+tAvailable+' available. Click <div style="display: inline-block" class="ui-state-default"><span class="ui-icon ui-icon-info"></span></div>  to update</b>');
      }
     // $("#flashFirmwareUrl").val(env.info.binary_url);
    } 
  }
  
  Espruino.Plugins.VersionChecker = {
    init : init,
  };
}());