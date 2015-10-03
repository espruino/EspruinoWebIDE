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
    Espruino.Core.App.addIcon({ 
      id: "deploy",
      icon: "deploy", 
      title : "Send to Espruino", 
      order: 400, 
      area: { 
        name: "code", 
        position: "top"
      }, 
      click: function() {
        Espruino.Core.MenuPortSelector.ensureConnected(function() {
          if (Espruino.Core.Terminal.isVisible()) 
            Espruino.Core.Terminal.focus(); // give the terminal focus
          Espruino.callProcessor("sending");
          Espruino.Core.Code.getEspruinoCode(Espruino.Core.CodeWriter.writeToEspruino);
        });
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
