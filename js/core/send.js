/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  "Send to Espruino" implementation
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
    // Configuration
    Espruino.Core.Config.add("AUTO_SAVE_CODE", {
      section : "Communications",
      description : "Save code automatically when clicking 'Send to Espruino'?",
      type : "boolean",
      defaultValue : 20, 
    });
    // Add stuff we need
    $('<button class="send">Send to Espruino</button>').appendTo(".toolbar .right");
    
    $( ".send" ).button({ text: false, icons: { primary: "ui-icon-transferthick-e-w" } }).click(function() {
      Espruino.Core.Terminal.focus(); // give the terminal focus
      if(Espruino.Config.AUTO_SAVE_CODE){
        Espruino.Config.set("code", Espruino.codeEditor.getValue()); // save the code
      }
      if (Espruino.Core.Serial.isConnected()) {
          getCode(Espruino.Core.CodeWriter.writeToEspruino);
      } else { 
        Espruino.Core.Status.setError("Not Connected");
      }
    });
  }
  
  function eventHandler(eventType) {
  }
  
  Espruino.Core.Send = {
    init : init,
    eventHandler : eventHandler,
  };
}());