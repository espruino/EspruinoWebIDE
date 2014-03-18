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
    // Add stuff we need
    $('<button class="send">Send to Espruino</button>').appendTo(".toolbar .right");
    
    $( ".send" ).button({ text: false, icons: { primary: "ui-icon-transferthick-e-w" } }).click(function() {
      Espruino.Core.Terminal.focus(); // give the terminal focus
      Espruino.callProcessor("sending");
      if (Espruino.Core.Serial.isConnected()) {
        Espruino.Core.Code.getEspruinoCode(Espruino.Core.CodeWriter.writeToEspruino);
      } else { 
        Espruino.Core.Status.setError("Not Connected");
      }
    });
    
    Espruino.addProcessor("connected", function(data, callback) {
      $(".send").button( "option", "disabled", false);
      callback(data);
    });
    Espruino.addProcessor("disconnected", function(data, callback) {
      $(".send").button( "option", "disabled", true);  
      callback(data);
    });     
  }
  
  Espruino.Core.Send = {
    init : init,
  };
}());