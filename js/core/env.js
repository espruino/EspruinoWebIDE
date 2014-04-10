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
  
  var JSON_DIR = "http://www.espruino.com/json/";
  
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
  
  /** Get a list of boards that we know about */
  function getBoardList(callback) {
    $.get(JSON_DIR + "boards.json", function(boards){
     // now load all the individual JSON files 
      var promises = [];      
      for (var boardId in boards) {
        promises.push((function() {
          var id = boardId;
          var dfd = $.Deferred();
          $.get(JSON_DIR + boards[boardId].json, function (data) {
            boards[id]["json"] = data;
            dfd.resolve();
          }, "json").fail(function () { dfd.resolve(); });
          return dfd.promise();
        })());
      }
      
      // When all are loaded, load the callback
      $.when.apply(null,promises).then(function(){ 
        callback(boards); 
      });      
    },"json").fail(callback(undefined));
  }
  
  Espruino.Core.Env = {
    init : init,
    getData : getData,
    getBoardData : getBoardData,
    getBoardList : getBoardList,
  };
}());