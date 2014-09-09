/**
 Copyright 2014 Juergen Marsch (juergenmarsch@googlemail.com)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Testing Plugin
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  var icon,
      datapoints = [],
      actionpoints = [],
      flotData = [],
      flotOptions = {
        legend:{noColumns:5,container:"#flotlegendholder"},
        xaxis:{mode:"time",ticks:5},
        grid:{hoverable:true},
        yaxes:[{},{min:0,max:1.05,show:false}]
      },
      flotDatasetOptions = {lines:{ show:true},clickable:false,hoverable:false},
      flotDatasetOptionsText = {points:{ show:true},yaxis:2,clickable:false,hoverable:true},
      flotChart,
      intervalName = "getExpressionsPoll",
      polling = false;
  function actionpoint(newValue){
    var cmd = "";
    this.label = newValue.label;
    this.expression = newValue.expression;
    this.type = newValue.type;
    this.assign = function(){
      switch(this.type){
        case "number":
          cmd = this.expression + '=' + $("#" + this.label + '_input').val() + ';';
          break;
        case "boolean":
          cmd = this.expression + '=' + $("#" + this.label + '_input')[0].checked + ';';
          break;
        case "string":
          cmd = this.expression + '="' + $("#" + this.label + '_input').val() + '";';
          break;
        case "command":
          cmd = $("#" + this.label + '_input').val() + ';';
          break;
      }
      if(Espruino.Core.Serial.isConnected()){
        Espruino.Core.Serial.write('\x03echo(0);\n' + cmd + '\necho(1);\n');
      }
      else{Espruino.Core.Notifications.error("Not Connected");}
    };
  }
  function datapoint(newValue){
    this.label = newValue.label;
    this.expression = newValue.expression;
    this.type = newValue.type;
    this.points = [];
    this.addValue = function(Value){
      if(this.points.length>99){
        this.points.shift();          
      }
      this.points.push(Value);
    };
    this.reset = function(){
      this.points = [];
    };
    this.reset();
  }
  function init() {
    Espruino.Core.Config.addSection("Testing", {
      sortOrder:600,
      description: "Displays a graph of values over time",
      tours: { "Testing Tour":"testing.json", "Extended Testing Tour":"testingExt.json" }
    });
    Espruino.Core.Config.add("ENABLE_Testing", {
      section : "Testing",
      name : "Enable Testing Plugin (BETA)",
      description : "This enables window to test application on Espruino",
      type : "boolean",
      defaultValue : false,
      onChange: function(newValue){showIcon(newValue);}
    });
    Espruino.Core.Config.add("FREQUENCY_Testing",{
      section: "Testing",
      name: "Frequency of new values",
      description: "Defines how fast new values will be scanned",
      type: {"200":"5/sec","500":"2/sec","1000":"1/sec","2000":"2secs","5000":"5secs","10000":"10secs"},
      defaultValue : 1000 
    });
    Espruino.addProcessor("getWatched", function (data, callback) {
      if(Espruino.Config.ENABLE_Testing){
        if(polling){setTestingValues(data);}
      }
      callback(data);
    });
    $("<div id='flottooltip'></div>").css({
      position: "absolute",display: "none",border: "1px solid #fdd",
      padding: "2px","background-color": "#fee",opacity: 0.80
    }).appendTo("body");
    showIcon(Espruino.Config.ENABLE_Testing);
    $('<div id="divTesting" class="Testing" style="display:none;border:none;height:100%;width:100%;"></div>').appendTo(".editor--terminal .editor__canvas");
    $.get("data/testing_initial.html",function(data){
      $("#divTesting").html(data);
      $("#testingAdd").button({ text:false, icons: { primary: "ui-icon-circle-plus"} }).click(addDataPoint);
      $("#saveTesting").button({ text:false, icons: { primary: "ui-icon-disk"} }).click(testingSaveAs);
      $("#loadTesting").button({ text:false, icons: { primary: "ui-icon-script"} }).click(loadTesting);
      showDataPoints();      
    },"html");
  }
  function testingSaveAs(){
    var html,dt = JSON.stringify({"dataPoints":datapoints,"actionPoints":actionpoints});
    html = '<table width="100%"><tr><th>Name</th><th>&nbsp;</th>';
    html += '<tr><th><input id="saveTestingName" type="text" value="myTest1" size="20 maxlength="40"></th>';
    html += '<th><button class="saveTestingBtn"></button></th></tr></table>';
    Espruino.Core.App.openPopup({
      position: "relative",
      title: "Save Testing as",
      id: "savetestingTab",
      contents: html
    });
    setTimeout(function(){
      $(".saveTestingBtn").button({ text:false, icons: { primary: "ui-icon-disk"} }).click(saveTestingAs);       
    },10);
    function saveTestingAs(){
      var fileName = $("#saveTestingName").val();
      $("#testingName").html("(<i><b>" + fileName + "</b></i>)");
      Espruino.Plugins.Project.saveFile("testing/" + fileName + ".json",dt);
      Espruino.Core.App.closePopup();      
    }
  }
  function loadTesting(){
    var header,row,footer;
    header = '<table width="100%">';
    row = '<tr><th>$name0</th>';
    row += '<th title="load datapoints"><button class="loadTestingBtn" fileentry="$fileentry"';
    row += ' filename="$name"></button></th></tr>';
    footer = '</table>';
    Espruino.Plugins.Project.loadDirHtml("","testing","JSON",header,row,footer,function(html){
      Espruino.Core.App.openPopup({
            position: "relative",
            title: "Load Testing",
            id: "loadtestingTab",
            contents: html
      });
      setTimeout(function(){
        $(".loadTestingBtn").button({ text:false, icons: { primary: "ui-icon-script"} }).click(loadTestingFile);
      },10);
    });
    function loadTestingFile(){
      var fileName = $(this).attr("filename");
      Espruino.Plugins.Project.loadFile("testing/" + fileName,function(data){
        var i,dt = JSON.parse(data);
        datapoints = [];
        for(i = 0; i < dt.dataPoints.length; i++){ datapoints.push(new datapoint(dt.dataPoints[i]));}
        actionpoints = [];
        for(i = 0; i < dt.actionPoints.length; i++){ actionpoints.push(new actionpoint(dt.actionPoints[i]));}
        showDataPoints();
        showActionPoints();          
        $("#testingName").html("(<i><b>" + fileName.split(".")[0] + "</b></i>)");
      });
      Espruino.Core.App.closePopup();
    }
  }
  function addActionNumber(){
    actionpoints.push(new actionpoint({label:$("#actionName").val(),expression:$("#actionExpression").val(),type:"number"}));
    showActionPoints();
  }
  function addActionBoolean(){
    actionpoints.push(new actionpoint({label:$("#actionName").val(),expression:$("#actionExpression").val(),type:"boolean"}));
    showActionPoints();    
  }
  function addActionString(){
    actionpoints.push(new actionpoint({label:$("#actionName").val(),expression:$("#actionExpression").val(),type:"string"}));
    showActionPoints();    
  }
  function addActionCommand(){
    actionpoints.push(new actionpoint({label:$("#actionName").val(),expression:$("#actionExpression").val(),type:"command"}));
    showActionPoints();    
  }
  function showActionPoints(){
    var i,html = "";
    html += '<table boder="1" id="actionTable">';
    for(i = 0; i < actionpoints.length; i++){
      html += '<tr>';
      html += '<th title="' + actionpoints[i].expression + '">' + actionpoints[i].label + '</th>';
      html += '<th>';
      switch(actionpoints[i].type){
        case "number":
          html += '<input type="text" id="' + actionpoints[i].label + '_input"' + ' size="10">';
          break;
        case "boolean":
          html += '<input type="checkbox" id="' + actionpoints[i].label + '_input">';
          break;
        case "string":
          html += '<input type="text" id="' + actionpoints[i].label + '_input"' + ' size="30">';
          break;
        case "command":
          break;
      }
      html += '<button i="' + i + '" class="executeActionPoint"></th>';
      html += '<th><button class="dropActionPoint" i="' + i.toString() + '">Drop</button></th>';
      html += '</tr>';
    }
    html += '</table>';
    $("#testingAction").html(html);
    $(".dropActionPoint").button({ text:false, icons:{ primary: "ui-icon-minus"}}).unbind().click(dropActionPoint);
    $(".executeActionPoint").button({ text:false, icons: { primary: "ui-icon-play"} }).unbind().click(runActionPoint);
  }
  function runActionPoint(){
    actionpoints[$(this).attr("i")].assign();
  }
  function dropActionPoint(){
    actionpoints.splice($(this).attr("i"),1);
    showActionPoints();
  }
  function dropAllAction(){
    actionpoints = [];
    $("#testingAction").html("");
  }
  function addDataPoint(){
    datapoints.push(new datapoint({label:$("#testingLabel").val(),expression:$("#testingExpression").val(),type:$("#testingType").val()}));
    showDataPoints();
  }
  function dropDataPoint(){
    datapoints.splice($(this).attr("i"),1);
    showDataPoints();
  }
  function dropAllDataPoints(){
    datapoints = [];
    showDataPoints();
  }
  function resetAllDataPoints(){
    for(var i = 0; i < datapoints.length; i++){
      datapoints[i].reset();
    }
    showDataPoints();
  }
  function showDataPoints(){
    var i,html = "",ds;
    html += '<table border="1" id="detailsTable">';
    if(datapoints.length === 0){
      datapoints.push(new datapoint({label:"Time",expression:"getTime()",type:"number"}));
      datapoints.push(new datapoint({label:"FreeMemory",expression:"process.memory().free",type:"number"}));
    }
    for(i = 0;i < datapoints.length; i++){
      html += '<tr>';
      html += '<td title="' + datapoints[i].expression + '\n(' + datapoints[i].type + ')">' + datapoints[i].label + '</td>';
      html += '<th><button class="dropDataPoint" i="' + i.toString() + '">Drop</button></th>';
      html += '<tr>';
    }
    html += '</table>';
    $("#testingTable").html(html);
    $(".dropDataPoint").button({ text:false, icons:{primary: "ui-icon-minus"}}).unbind().click(dropDataPoint);
    $("#testingExpressionRun").button({ text:false, icons: { primary: "ui-icon-play"} }).unbind().click(runGetExpression);
    $("#testingExpressionStop").button({ text:false, icons: { primary: "ui-icon-stop"} }).unbind().click(stopGetExpression);
    $("#testingExpressionStop").button('option','disabled', true);
    $("#testingExpressionClear").button({ text:false, icons:{primary:"ui-icon-minusthick"}}).unbind().click(dropAllDataPoints);
    $("#testingExpressionReset").button({ text:false, icons:{primary:"ui-icon-seek-first"}}).unbind().click(resetAllDataPoints);
    $("#testingSetClear").button({ text:false, icons:{primary:"ui-icon-minusthick"}}).unbind().click(dropAllAction);
    $("#testingAddNumber").button({ text:false, icons:{primary:"ui-icon-calculator"}}).unbind().click(addActionNumber);
    $("#testingAddBoolean").button({ text:false, icons:{primary:"ui-icon-check"}}).unbind().click(addActionBoolean);
    $("#testingAddString").button({ text:false, icons:{primary:"ui-icon-pencil"}}).unbind().click(addActionString);
    $("#testingAddCommand").button({ text:false, icons:{primary:"ui-icon-script"}}).unbind().click(addActionCommand);
    showFlotCharts();
  }
  function runGetExpression(){
    if(Espruino.Core.Serial.isConnected()){
      $("#testingExpressionStop").button( "option", "disabled", false);
      $("#testingExpressionRun").button( "option", "disabled", true);
      pollData();
      polling = true;
    }
    else{Espruino.Core.Notifications.error("Not Connected");}    
  }
  function stopGetExpression(){
    Espruino.Core.Serial.write('\x03clearInterval(' + intervalName + ');\ndelete ' + intervalName + ';\necho(1);\n');
    $("#testingExpressionStop").button( "option", "disabled", true);
    $("#testingExpressionRun").button( "option", "disabled", false); 
    polling = false;   
  }
  function showFlotCharts(){
    var d,dp,lastData;
    flotData = [];
    for(var i = 0; i < datapoints.length;i++){
      d = {label:datapoints[i].label,data:[]};
      switch(datapoints[i].type){
        case "number":
          for(var j = 0; j < datapoints[i].points.length; j++){
            d.data.push(datapoints[i].points[j]);
          }
          $.extend(true,d,flotDatasetOptions);
          break;
        case "text":
          lastData = "";
          for(var j = 0; j < datapoints[i].points.length; j++){
            dp = datapoints[i].points[j];
            if(dp[1] && (dp[1] != lastData)){
              d.data.push([dp[0],1,dp[1]]);
              lastData = dp[1];
            }      
          }
          $.extend(true,d,flotDatasetOptionsText);
          break;
      }
      flotData.push(d);
    }
    flotChart = $.plot($("#flotplaceholder"),flotData,flotOptions);
    $("#flotplaceholder").unbind().on("plothover",function(event,pos,item){
      if(item){
        $("#flottooltip").html(item.series.data[item.dataIndex][2])
        .css({top: item.pageY+5, left: item.pageX+5})
        .fadeIn(200);
      } else {$("#flottooltip").hide();}
    });
  }
  function pollData(){
    var cmd = "var " + intervalName + "=setInterval(function(){\nvar d={";
    for(var i = 0; i < datapoints.length; i++){
      if(i>0){ cmd += ","; }
      cmd += '"' + datapoints[i].label + '":' + datapoints[i].expression;
    }
    cmd += "};\n";
    cmd += "console.log(\"<<<<<\" + JSON.stringify(d) + \">>>>>\");\n";
    cmd += "}," + Espruino.Config.FREQUENCY_Testing + ");\n";
    //Espruino.Core.Serial.write('\x03echo(0);\n' + cmd + '\n');
    Espruino.Core.Serial.write(cmd);
  }
  function showIcon(newValue){
    if(newValue){
      icon = Espruino.Core.App.addIcon({
        id:'terminalTesting',
        icon: 'code',
        title: 'Switch to testing page',
        order: 600,
        area: {
          name: "terminal",
          position: "bottom"
        },
        click: openTestingWindow
      });
    }
    else{
      if (icon!==undefined) icon.remove();
    }
  }
  function openTestingWindow(){
    if (isInTesting()) {
      switchToCode();
      Espruino.Core.EditorJavaScript.madeVisible();
    } 
    else { switchToTesting();}
  }
  function switchToTesting() {
    $("#terminal").hide();
    $("#divTesting").show();
    icon.setIcon("eye");
  }
  function switchToCode() {
    $("#divTesting").hide();
    $("#terminal").show();
    icon.setIcon("code");
  } 
  function setTestingValues(data){
    var i,j,dt,utc;
    utc = new Date().getTime();
    dt = JSON.parse(data);
    if(typeof dt === "object"){
      for(i in dt){
        for(j = 0; j < datapoints.length;j++){
          if(i === datapoints[j].label){          
            datapoints[j].addValue([utc,dt[i]]);
          }
        }
      }
    }
    showFlotCharts();      
  }
  function isInTesting() {
    return $("#divTesting").is(":visible");
  }
  Espruino.Plugins.Testing = {
    init : init
  };
}());