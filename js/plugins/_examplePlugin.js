/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  An Example Plugin
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
    Espruino.Core.Config.add("MAX_FOOBARS", {
      section : "Communications",
      name : "Foobar Count",
      description : "How many foobars?",
      type : "int",
      defaultValue : 20, 
      onChange : function(newValue) {  }
    });
  }
  
  Espruino.Plugins.ExamplePlugin = {
    init : init,
  };
}());