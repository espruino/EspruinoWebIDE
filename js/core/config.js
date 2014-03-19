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
  
  function loadConfiguration(callback) {
    chrome.storage.sync.get( "CONFIGS", function (data) {
      var value = data["CONFIGS"];
      console.log("GET chrome.storage.sync = "+JSON.stringify(value));
      for (var key in value) { 
        Espruino.Config[key] = value[key];
        if (Espruino.Core.Config.data[key] !== undefined &&
            Espruino.Core.Config.data[key].onChange !== undefined)
          Espruino.Core.Config.data[key].onChange(value[key]);
      }  
      if (callback!==undefined)
        callback();
    });
  }
  
  function init() {    
  }
  
  function add(name, options) {
    Espruino.Core.Config.data[name] = options;
    if (Espruino.Config[name] === undefined)
      Espruino.Config[name] = options.defaultValue;
  }
  
  /** Get a list of 'sections' used in all the configs */
  function getSections() {
    var sections = [];
    for (var i in Espruino.Core.Config.data) {
      var c = Espruino.Core.Config.data[i];
      if (sections.indexOf(c.section)<0)
        sections.push(c.section);
    }
    return sections;
  }
  
  Espruino.Config = {};
  Espruino.Config.set = function (key, value) {
    if (Espruino.Config[key] != value) {
      Espruino.Config[key] = value;
      // Do the callback
      if (Espruino.Core.Config.data[key] !== undefined &&
          Espruino.Core.Config.data[key].onChange !== undefined)
        Espruino.Core.Config.data[key].onChange(value);
      // Save to synchronized storage...
      console.log("SET chrome.storage.sync = "+JSON.stringify(Espruino.Config));
      chrome.storage.sync.set({ CONFIGS : Espruino.Config});    
    }
  };
  
  Espruino.Core.Config = {
      loadConfiguration : loadConfiguration, // special - called before init 
      
      init : init,
      add : add,
      data : {},
      
      getSections : getSections,
  };
  
})();