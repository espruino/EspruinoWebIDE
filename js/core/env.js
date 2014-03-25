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
  var boardData = {};
  
  function init() {
    
    
    Espruino.addProcessor("connected", queryBoardProcess);
  }
  
  function queryBoardProcess(data, callback) {
    Espruino.Core.Utils.executeExpression("process.env", function(result) {
      var json = {};
      if (result!==undefined) {
        try {       
          json = JSON.parse(result);
        } catch (e) {
          console.log("JSON parse failed - " + e);
        }
      }
      // now process the enviroment variables
      for (var k in json) {
        boardData[k] = json[k];
        environmentData[k] = json[k];
      }
      
      Espruino.callProcessor("environmentVar", environmentData, function(data) { 
        environmentData = data; 
      }); 
      callback(data);
    });    
  }
  
  /** Get all data merged in from the board */
  function getData() {
    return environmentData;
  }
  
  /** Get just the board's environment data */
  function getBoardData() {
    return boardData;
  }
  
  Espruino.Core.Env = {
    init : init,
    getData : getData,
    getBoardData : getBoardData
  };
}());