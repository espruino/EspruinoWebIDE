/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Initialisation code
 ------------------------------------------------------------------
**/
"use strict";

var Espruino;

(function() {
  
  var eventHandlers = [];
  
  function init() {    
    // Initialise all modules
    
    function initModule(mod) {
      if (mod.init !== undefined)
        Espruino.Core[module].init();
      if (mod.eventHandler !== undefined)
        eventHandlers.push(mod.eventHandler);
    }
    
    var module;
    for (module in Espruino.Core) initModule(Espruino.Core[module]);
    for (module in Espruino.Plugins) initModule(Espruino.Plugins[module]);
  }
  
  // workaround for broken chrome on Mac
  if (navigator.userAgent.indexOf("Mac OS X")>=0 &&
      navigator.userAgent.indexOf("Chrome/33.0.1750")>=0) {
    $(document).ready(function() { window.setTimeout(init,100); });
  } else {
    $(document).ready(init);
  }
  
  /** EVENTS:
   *  connected
   *  disconnected
   *  sending
   */
  function sendEvent(eventType) {
    for (var i in eventHandlers)
      eventHandlers[i](eventType);
  }
  
  // -----------------------------------
  Espruino = { 
    Core : { }, 
    Plugins : { },
    sendEvent : sendEvent,
  };

})();


