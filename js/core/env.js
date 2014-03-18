/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Board Environment variables (process.env) - queried when board connects 
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  var environmentData = {};
  
  function init() {
    
    
    Espruino.addProcessor("connected", queryBoardProcess);
  }
  
  function queryBoardProcess(data, callback) {
    Espruino.Core.Utils.executeExpression("process.env", function(result) {
      environmentData = {};
      if (result!==undefined) {
        try {       
          environmentData = JSON.parse(result);
        } catch (e) {
          console.log("JSON parse failed - " + e);
        }
      }
      callback(data);
    });    
  }
  
  function getData() {
    return environmentData;
  }
  
  Espruino.Core.Env = {
    init : init,
    getData : getData 
  };
}());