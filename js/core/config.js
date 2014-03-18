/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Central place to store and retrieve Options
  
  To use this, on your plugin's `init` function, do something like the
  following:
  
  Espruino.Core.Config.add("MAX_FOOBARS", {
    section : "Communications",           // Heading this will come under in the config screen
    name : "Foobars",                     // Nice name 
    description : "How many foobars?",    // More detail about this
    type : "int"/"boolean"/"string"/{ value1:niceName, value2:niceName },
    defaultValue : 20, 
    onChange : function(newValue) { ... }
  });
  
    * onChange will be called whenever the value changes from the default
      (including when it is loaded)
  
  Then use: 
  
  Espruino.Config.MAX_FOOBARS in your code
 ------------------------------------------------------------------
**/
"use strict";
(function() {
  
  function init() {
    
  }
  
  function add(name, options) {
    Espruino.Core.Config.data[name] = options;
    Espruino.Config[name] = options.defaultValue;
  }  
  
  Espruino.Config = {};
  Espruino.Config.set = function (key, value) {
    Espruino.Config[key] = value;
    // TODO: Save to storage...
  }
  
  Espruino.Core.Config = {
      init : init,
      add : add,
      data : {},
  };
  
})();