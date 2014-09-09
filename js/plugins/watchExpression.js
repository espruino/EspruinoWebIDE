/**
 Copyright 2014 Juergen Marsch (juergenmarsch@googlemail.com)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Local Project handling Plugin
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  var icon;
  var watchRunning = false;
  var datapoints = [];
  var intervalName = "watchPoll";
  var watchMode = "poll";
  function datapoint(label){
    this.label = label;
    this.points = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  }
  function init() {
    Espruino.Core.Config.addSection("Watch", {
      sortOrder:600,
      description: "Watch Expressions",
      tours: { "Watch Tour":"watchExpr.json" }
    });
    Espruino.Core.Config.add("ENABLE_Watch", {
      section : "Watch",
      name : "Enable Watch Expression Plugin (BETA)",
      description : "This enables popup window to watch expressions from Espruino",
      type : "boolean",
      defaultValue : false,
      onChange: function(newValue){showIcon(newValue);}
    });
    Espruino.Core.Config.add("DURATION_Watch",{
      section: "Watch",
      name: "Duration to watch",
      description: "Defines maximal duration of watching",
      type: {"10000":"10 secs","60000":"Minute","300000":"5 Minutes","-1":"until_stop"},
      defaultValue : 60000
    });
    Espruino.Core.Config.add("FREQUENCY_Watch",{
      section: "Watch",
      name: "Frequency of watching",
      description: "Defines how fast watching will happen",
      type: {"200":"5/sec","500":"2/sec","1000":"1/sec","2000":"2secs","5000":"5secs","10000":"10secs"},
      defaultValue : 2000 
    });
    Espruino.Core.Config.add("SCALE_Watch",{
      section:"Watch",
      name: "Scale",
      description: "Scaling values for watching expressions",
      type: {"":"auto","0,100":"0-100","0,1000":"0-1000","-100,100":"+-100"},
      defaultValue: "" 
    });
    Espruino.addProcessor("getWatched", function (data, callback) {
      if(Espruino.Config.ENABLE_Watch){
        if(watchRunning){setWatchValues(data);}
      }
      callback(data);
    });
    showIcon(Espruino.Config.ENABLE_Watch);
    Espruino.Plugins.Tour.addTourButton("data/tours/watchExpression.json");
  }
  function showIcon(newValue){
    if(newValue){
      icon = Espruino.Core.App.addIcon({
        id:'terminalWatch',
        icon: 'eye',
        title: 'Watch expressions',
        order: 600,
        area: {
          name: "terminal",
          position: "top"
        },
        click: openWatchPopUp
      });
    }
    else{
      if (icon!==undefined) icon.remove();
    }
  }
  function openWatchPopUp(){
    var html = "",i;
    html += '<table width="100%"><tr>'
    html += '<th align="left"><button class="runWatch">start</button><button class="stopWatch">stop</button></th>';
    html += '<th align="left">Refresh: ' + Espruino.Config.FREQUENCY_Watch + "msec&nbsp;&nbsp;&nbsp;";
    html += 'Duration: ' + Espruino.Config.DURATION_Watch + 'msec</th>';
    html += '</table>';
    html += '<table border="1" id="detailsTable">';
    if(datapoints.length === 0){
      datapoints.push(new datapoint("getTime()"));
      datapoints.push(new datapoint("process.memory().free"));
    }
    for(i = 0;i < datapoints.length; i++){
      html += '<tr>';
      html += '<th>' + datapoints[i].label + '</th>';
      html += '<th><span id="datapoint_' + i.toString() + '"></span><br>';
      html += '<span id="sparkline_' + i.toString() + '"></span></th>';
      html += '<th><button class="dropWatchpoint" i="' + i.toString() + '">Drop</button>';
      html += '<tr>';
    }
    html += '<tr>';
    html += '<th><input id="newLabel" type="text"></th>';
    html += '<th><button class="addWatchpoint">Add</button>';
    html += '</tr>';
    html += '</table>';
    Espruino.Core.App.openPopup({
      position: "relative",
      title: "Watches",
      id: "watchPopup",
      contents: html
    });
    $(".runWatch").button({ text:false, icons: { primary: "ui-icon-play"} }).click(runWatch);
    $(".stopWatch").button({ text:false, icons: { primary: "ui-icon-stop"} }).click(stopWatch);
    $(".stopWatch").button('option','disabled', true);
    $(".addWatchpoint").button({ text:false, icons: { primary: "ui-icon-plusthick"} }).click(addWatchpoint);
    $(".dropWatchpoint").button({ text:false, icons: { primary: "ui-icon-trash"} }).click(dropWatchpoint);    
  }
  function addWatchpoint(e){
    datapoints.push(new datapoint($("#newLabel").val()));
    Espruino.Core.App.closePopup();
    openWatchPopUp();
  }
  function dropWatchpoint(e){
    datapoints.splice($(this).attr("i"),1);
    Espruino.Core.App.closePopup();
    openWatchPopUp();
  }
  function runWatch(e){
    if(Espruino.Core.Serial.isConnected()){
      watchMode = $(".watchMode").filter(":checked").val();
      $(".stopWatch").button( "option", "disabled", false);
      $(".runWatch").button( "option", "disabled", true);
      watchRunning = true;
      pollData();
    }
    else{Espruino.Core.Notifications.error("not connected");}    
  }
  function stopWatch(e){
    Espruino.Core.Serial.write('\x03clearInterval(' + intervalName + ');\ndelete ' + intervalName + ';\necho(1);\n')
    $(".stopWatch").button( "option", "disabled", true);
    $(".runWatch").button( "option", "disabled", false);
    watchRunning = false;    
  }
  function pollData(){
    var cmd = "var " + intervalName + "=setInterval(function(){var d=[";
    for(var i = 0; i < datapoints.length; i++){
      if(i>0){ cmd += ","; }
      cmd += datapoints[i].label;
    }
    cmd += "];";
    cmd += "console.log(\"<<<<<\" + JSON.stringify(d) + \">>>>>\");";
    cmd += "}," + Espruino.Config.FREQUENCY_Watch + ");";
    if(Espruino.Config.DURATION_Watch>1){
      cmd += "var " + intervalName + "_stop=setTimeout(function(){clearInterval(" + intervalName + ");";
      cmd += "delete " + intervalName + "}"
      cmd += "," + Espruino.Config.DURATION_Watch + ");";
    }
    Espruino.Core.Serial.write('\x03echo(0);\n' + cmd + '\n');
  }
  function setWatchValues(data){
    var i,opt,options,dataset = JSON.parse(data);
    opt = Espruino.Config.SCALE_Watch.split(",");
    if(opt.length>1){options = {"chartRangeMin":opt[0],"chartRangeMax":opt[1]};}
    else {options = {};}
    for(i = 0; i < dataset.length; i++){
      datapoints[i].points.shift();
      datapoints[i].points.push(dataset[i]);
      $("#sparkline_" + i.toString()).sparkline(datapoints[i].points,options);
      $("#datapoint_" + i.toString()).html(dataset[i].toString());
    }      
  }
  Espruino.Plugins.Watch = {
    init : init
  };
}());