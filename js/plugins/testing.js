/**
 Copyright 2014,2015 Juergen Marsch (juergenmarsch@googlemail.com)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Testing Plugin
 ------------------------------------------------------------------
**/
"use strict";
( function(){
  var p // for temp prototype
    , icon
    , datapoints = []
    , actionpoints = []
    , imageUrl = ""
    , testingFile = ""
    , testMode = "Form" // Form | Image
    , overlay
    , frequency = 1
    , testDescription = ""
    , testProject = ""
    , intervalName = "getExpressionsPoll"
    , polling = false
    , activePoll = true
    , pollPnt
    , testDebug = true
    , testLogging = false
    , testLoggingName = ""
    , flotData = []
    , flotChart
    , flotOptions = {legend:{noColumns:5,container:"#flotlegendholder"},grid:{hoverable:true},
        xaxis:{mode:"time",ticks:5},yaxes:[{},{min:0,max:1.05,show:false}]
      }
    , flotDatasetOptions = {lines:{ show:true},clickable:false,hoverable:false}
    , flotDatasetOptionsText = {points:{ show:true},yaxis:2,clickable:false,hoverable:true}
    ;

  // ========== Action ==========

  function Actionpoint(newValue) { // constructor / state
    var i,cmd = "";
    for(i in newValue){this[i] = newValue[i];}
    this.type = (this.type === "text") ?"string" : this.type;
  };
  // Action behavior
  p = Actionpoint.prototype;
  p.getValueField = function(label) { return $("input[label='" + label + "']")[0];}
  p.setLocation = function(x,y) {this.x = x;this.y = y;};
  p.update = function(expression,type) {
    this.expression = expression;
    this.type = type;
  };
  p.assign = function() {
    var cmd = "";
    switch(this.type){
      case "number":
        cmd = this.expression + '=' + this.getValueField(this.label).value + ';';
        break;
      case "boolean":
        cmd = this.expression + '=' + this.getValueField(this.label).checked + ';';
        break;
      case "string":
        cmd = this.expression + '="' + this.getValueField(this.label).value + '";';
        break;
      case "command":
        cmd = this.expression + ';';
        break;
    }
    if (Espruino.Core.Serial.isConnected()) {
      Espruino.Core.Serial.write('\x03\x10' + cmd + '\n');
    } else {
      notification("E","nc");
    }
  };
  p.getHtmlEdit = function(i) {
	var html = "";
	html = "<tr>";
	html += '<th class="alterActionPoint" title="' + this.expression + '\n' + this.type + '">' + this.label + '</th>';
	html += '<th>';
	switch(this.type){
	  case "number":
	    html += '<input type="text" class="testing_input" label="' + this.label + '" size="10">';
		break;
	  case "boolean":
		html += '<input type="checkbox" class="testing_input" label"' + this.label + '">';
		break;
	  case "string":
		html += '<input type="text" class="testing_input" label="' + this.label + '" size="30">';
		break;
	  case "command":
		break;
	}
	html += '<button i="' + i + '" class="executeActionPoint"></th>';
	html += '<th><button class="dropActionPoint" i="' + i.toString() + '">Drop</button></th>';
	html += '</tr>';
	return html;
  };
  p.getSetxyHtml = function(i) {
    var html = "";
    html += '<tr><th class="ap_class" pnt="' + i + '">Assign</th>';
    html += '<td colspan="2" title="' + this.expression + '">' + this.label + '</td></tr>';
    return html;
  };
  // /Action

  // ========== Datapoint ==========

  function Datapoint(newValue) { // constructor / state
    var i;
    for(i in newValue){this[i] = newValue[i];}
    this.type = (this.type === "text") ? "string" : this.type;
    this.points = [];
  }
  // Datapoint behavior
  p = Datapoint.prototype;
  p.setLocation = function(x,y,display){this.x = x; this.y = y; this.display = display;};
  p.update = function(expression,type){ this.expression = expression; this.type = type;};
  p.addValue = function(Value){
    if(this.points.length>99){ this.points.shift(); }
    this.points.push(Value);
  };
  p.reset = function(){ this.points = []; };
  p.getHtmlEdit = function(i){
    var html = "";
    html += '<tr>';
    html += '<td class="alterDataPoint" title="' + this.expression + '\n' + this.type + '">' + this.label + '</td>';
    html += '<th><button class="dropDataPoint" i="' + i.toString() + '">Drop</button></th>';
    html += '<tr>';
    return html;
  };
  p.getSetxyHtml = function(i){
    var dpHtml,html = "";
    dpHtml = '<select id="DPid_"><option value="none">none<option value="T">String<option value="N">Number';
    dpHtml += '<option value="A">Alarm<option value="W">Warning<option value="S">Status<option value="B">Bar';
    dpHtml += '<option value="G">Gauge<option value="SP">Speech<option value="SW">Switch Testing</select>';
    html += '<tr><th class="dp_class" pnt="' + i + '" title="' + this.x + ',' + this.y + '"><u>Assign</u></th>';
    html += '<td title="' + this.expression + '">' + this.label  + '</td>';
    html += '<td>'+ dpHtml.replace(/DPid_/,"DPid_" + i) + '</td></tr>';
    return html;
  };

  function imageOverlay(id){
    var canvas,c,octx,scaleX,scaleY,p,me = this;
    canvas = $(id);
    c = canvas[0];
    p = $(c).parent();
    c.width = p.width();
    c.height = p.height();
    octx = c.getContext('2d');
    scaleX = c.width / 1000;
    scaleY = c.height / 1000;
    function calcX(x){ return x * scaleX;}
    function calcY(y){ return y * scaleY;}
    function action(x,y){
      var d,i,a;
      for(i = 0; i < actionpoints.length;i++){
        a = actionpoints[i];
        if(a.x !== 0){
          d = Math.sqrt((a.x-x)*(a.x-x) + (a.y-y)*(a.y-y));
          if(d<20){
            a.assign();
          }
        }
      }
    }
    this.drawPoints = function(dt){
      var d,v,i,j;
      overlay.clear();
      for(i in dt){
        v = dt[i];
        for(j = 0; j < datapoints.length; j++){
          d = datapoints[j];
          if(d.label === i){
            switch(d.display){
              case "A":this.drawAlarm(d,v); break;
              case "W":this.drawAlarm(d,v);break;
              case "S":this.drawAlarm(d,v);break;
              case "B":this.drawBar(d,v);break;
              case "N":this.drawText(d,parseFloat(v,2));break;
              case "T":this.drawText(d,v);break;
              case "SW":this.reload(v + '.json');break;
              case "SP":this.speak(v);break;
              case "G":this.drawGauge(d,v);break;
            }
          }
        }
      }
    }
    this.speak = function(t){ if(t !== "") Espruino.Plugins.Notification_Sound.speak(t);};
    this.clear = function(){ canvas.clearCanvas(); };
    this.drawAlarm = function(d,v){
      var s,c;
      switch(d.display){case "A":c="red";break;case "W":c = "orange";break;case "S":c = "green";break;}
      if(v > 0){
        s = {fillStyle:c,x:calcX(d.x),y:calcY(d.y),width:20,height:20};
        $.extend(s,(typeof(d.style) === "undefined")?{}:d.style);
        s.fillStyle = (typeof(s.color) === "undefined")?c:s.color;
      }
      else{
        s = {strokeStyle:c,strokeWidth:1,x:calcX(d.x),y:calcY(d.y),width:20,height:20};
        $.extend(s,(typeof(d.style) === "undefined")?{}:d.style);
        s.strokeStyle = (typeof(s.color) === "undefined")?c:s.color;
      }
      s.width = calcX(s.width); s.height = calcY(s.height);
      canvas.drawEllipse(s);
    };
    this.drawBar = function(d,v){
      var s;
      s = {strokeStyle:"#000",fromCenter: false, x: calcX(d.x), y: calcY(d.y),width: 20,height: 100};
      $.extend(s,(typeof(d.style)  === "undefined")?{}:d.style);
      s.width = calcX(s.width);s.height = -calcX(s.height);
      canvas.drawRect(s);
      s = {fillStyle:"blue",fromCenter: false, x: calcX(d.x), y: calcY(d.y),width: 20,height: 100};
      $.extend(s,(typeof(d.style)  === "undefined")?{}:d.style);
      s.width = calcX(s.width);s.height = -calcX(v / 100 * s.height);
      canvas.drawRect(s);
    };
    this.drawText = function(d,t){
      var s;
      s = {fillStyle: "black",x: calcX(d.x), y: calcY(d.y),fontSize: 14,fontFamily: "Arial",text: t};
      $.extend(s,(typeof(d.style)  === "undefined")?{}:d.style);
      canvas.drawText(s);
    };
    this.drawGauge = function(d,v){
      var s;
      s = {x:calcX(d.x),y:calcY(d.y),width:100,height:100,angle:270,
          strokeCase:"#000",strokeBackground:"#8f8",strokeValue:"#00f",strokePointer:"#f00"};
      $.extend(s,(typeof(d.style)  === "undefined")?{}:d.style);
      s.width = calcX(s.width); s.height = calcY(s.height);
      var aStep = Math.PI /180,
          ePX = s.x + (s.width / 2 * 0.8 * Math.cos(calcAngle(calcTargetA(v)))),
          ePY = s.y + (s.height / 2 * 0.6 * Math.sin(calcAngle(calcTargetA(v))));
      function calcTargetA(v){ return -s.angle/2 + s.angle/100 * v;}
      function calcAngle(a){ return (a + 270) * aStep; }
      canvas.drawEllipse({
        strokeStyle:s.strokeCase,strokeWidth:1,
        x:s.x,y:s.y,width:s.width,height:s.height
      }).drawArc({
        strokeStyle:s.strokeBackground,strokeWidth:9,
        x:s.x,y:s.y,radius:s.width / 2 * 0.8,
        start:-s.angle/2,end:s.angle/2
      }).drawArc({
        strokeStyle:s.strokeValue,strokeWidth:4,
        x:s.x,y:s.y,radius:s.width / 2 * 0.8,
        start:-s.angle/2,end:-s.angle/2 + v/100*s.angle
      }).drawEllipse({
        strokeStyle:s.strokePointer,strokeWidth:1,
        x:s.x,y:s.y,width:s.width / 20,height:s.height / 20
      }).drawLine({
        strokeStyle:s.strokePointer,strokeWidth: 2,
        rounded: true,endArrow: true,arrowRadius: 5,arrowAngle: 60,
        x1:s.x,y1:s.y,x2:ePX,y2:ePY
      });
    };
    this.bind = function(){
      $(c).unbind().click(function(e){
        var x,y;
        x = parseInt(e.offsetX * 1000 / p.width(),0);
        y = parseInt(e.offsetY * 1000 / p.height(),0);
        if(Espruino.Core.Serial.isConnected()){
          action(x,y);
        }
        else{
          assignImageXYtoTestingItem(x,y);
        }
      });
    };
    this.reload = function(fileName){
      if(fileName !== testingFile){
        stopGetExpression();
        setTimeout(function(){
          newTestingFile(fileName,function(){runGetExpression();});
        },100);
      }
    };
  }

  function notification(type,pnt){
    var t;
    switch(pnt){
      case "nrm": t = "Not available in running mode";break;
      case "orm": t = "Only available in running mode";break;
      case "nid": t = "Cannot switch mode, no Image defined";break;
      case "nc": t = "Not connected to board";break;
      case "nan": t = "Replaced non alphanumeric by underline";break;
      case "dpc": t = "Existing datapoint altered";break;
      case "apc": t = "existing actionpoint altered";break;
      case "nsl": t = "stop testing and restart to switch logging";break;
      default: t = "Sorry, unknown message (pnt="+pnt+")";break;
    }
    switch(type){
      case "E": Espruino.Core.Notifications.error(t);break;
      case "W": Espruino.Core.Notifications.warning(t);break;
      case "I": Espruino.Core.Notifications.info(t);break;
      default: Espruino.Core.Notifications.info(t);break;
    }
  }

  function replaceNonAlphaNumeric(v){
    var r = v;
    if(r.match(/\W+/g, "_")){
      notification("W","nan");
      r = r.replace(/\W+/g, "_");
    }
    return r;
  }

  function init() {
    Espruino.Core.Config.addSection("Testing", {
      sortOrder:600,
      description: "Displays a graph of values over time",
      getHTML: function(callback){
        var url,html;
        url = "https://www.youtube.com/playlist?list=PLWusBqvaPOec0RJ-_iqPkvCAeKYyIb6mH;";
        html = '<h3>Videos on youtube</h3>';
        html += 'Some videos are available on playlist for <a href="' + url + '" target="_blank">Espruino Testing</a>';
        callback(html);
      },
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
    Espruino.addProcessor("getWatched", function (data, callback) {
      if(Espruino.Config.ENABLE_Testing){
        if(polling){setTestingValues(data);}
      }
      callback(data);
    });
    Espruino.addProcessor("disconnected",function(data, callback){
      if(polling){stopGetExpression();}
      callback(data);
    });
    $("<div id='flottooltip'></div>").css({
      position: "absolute",display: "none",border: "1px solid #fdd",
      padding: "2px","background-color": "#fee",opacity: 0.80
    }).appendTo("body");
    showIcon(Espruino.Config.ENABLE_Testing);
    $('<div id="divTesting" class="Testing" style="display:none;border:none;height:100%;width:100%;"></div>').appendTo(".editor--terminal .editor__canvas");
    loadInitial(resetForm);
    function resetForm(){ showDataPoints();showActionPoints(); }
  }

  function loadInitial(callback){
    $('<div id="divTesting" class="Testing" style="display:none;border:none;height:100%;width:100%;"></div>').appendTo(".editor--terminal .editor__canvas");
    $.get("data/testing_initial.html",function(data){
      $("#divTesting").html(data);
      setTimeout(function(){
        $("#saveTesting").button({ text:false, icons: { primary: "ui-icon-disk"} }).unbind().click(testingSaveAs);
        $("#loadTesting").button({ text:false, icons: { primary: "ui-icon-script"} }).unbind().click(loadTesting);
        $("#testingExpressionRun").button({ text:false, icons: { primary: "ui-icon-play"} }).unbind().click(runGetExpression);
        $("#testingExpressionStop").button({ text:false, icons: { primary: "ui-icon-stop"} }).unbind().click(stopGetExpression);
        $("#testingExpressionStop").button('option','disabled', true);
        $("#testingLog").unbind().click(switchLogging);
        $("#openTestingLog").button({ text:false, icons: { primary:"ui-icon-image"} }).unbind().click(openTestingLog);
        $("#testProperties").unbind().click(showTestingProperties);
        showDataChart();
      },50);
    },"html");
    if(callback){ callback(); }
  }

  function testingSaveAs(){
    resetAllDataPoints();
    if (polling) {
      notification("W","nrm");
    } else {
      var html
        = '<table width="100%">'
        +   '<tr><th>Name</th></tr>'
        +   '<tr><td><input id="saveTestingName" type="text" value="'
                + testingFile.split(".")[0]
                + '" size="20" maxlength="40"></td></tr>'
        +   '<tr><td><button class="saveTestingBtn">Save</button></td></tr>'
        + '</table>'
        ;
      Espruino.Core.App.openPopup({
        position: "relative",
        title: "Save Testing as",
        id: "savetestingTab",
        contents: html
      });
      setTimeout(function(){
        $(".saveTestingBtn").button({ text:true, icons: { primary: "ui-icon-disk"} }).click(testingSaveAsDo);
      },10);
    }
  } // /testingSaveAs

  function testingSaveAsDo() {
    var fileName = $("#saveTestingName").val();
    $("#testingName").html("(<i><b>" + fileName + "</b></i>)");
    var dt = {
      imageUrl:imageUrl,testMode:testMode,frequency:frequency,activePoll:activePoll,
      testDescription:testDescription,testProject:testProject,
      debug:testDebug,dataPoints:datapoints,actionPoints:actionpoints };
    Espruino.Plugins.Project.saveFile("testing/" + fileName + ".json",JSON.stringify(dt,null,2));
    Espruino.Core.App.closePopup();
  } // /testingSaveAsDo

  function loadTesting() {
    if (polling) {
      notification("W","nrm");
    } else {
      var header = '<table width="100%">';
      // uses loadDirHtml() aka getProjectTable() from projects.js - in a nutshell:
      // in list row template $name0 (display, without extension, $fileentry,
      // and $name are replaced for each *.json ext file found in directory.
      var row
        = '<tr"><th class="loadTestingEntry" title="load testing file" fileentry="$fileentry" filename="$name">'
        +     '<button class="loadTestingBtn"></button><span class="cursor:pointer; cursor:hand;"> $name0</span>'
        + '</th></tr>'
        ;
      var footer = '</table>';
      // loadDirHtml|getProjectTable(html,subDir,ext,header,row,footer,callback){...
      Espruino.Plugins.Project.loadDirHtml("","testing","JSON",header,row,footer,function(html){
        Espruino.Core.App.openPopup({
              position: "relative",
              title: "Load Testing",
              id: "loadtestingTab",
              contents: html
        });
        setTimeout(function(){
          $(".loadTestingBtn").button({ text:false, icons: { primary: "ui-icon-script"} });
          $(".loadTestingEntry").css({"cursor":"pointer"}).click(loadTestingFile);
        },10);
      });
    }
  }

  function loadTestingFile() {
    var fileName = $(this).attr("filename");
    newTestingFile(fileName,loadProject);
    Espruino.Core.App.closePopup();
  }

  function loadProject() {
    if(testProject !== ""){
      Espruino.Plugins.Project.loadFile("projects/" + testProject + ".js",function(data){
        Espruino.Core.EditorJavaScript.setCode(data);
      });
    }
  }

  function newTestingFile(fileName,callback){
    Espruino.Plugins.Project.loadFile("testing/" + fileName,function(data){
      var i,dt = JSON.parse(data);
      datapoints = [];
      for(i = 0; i < dt.dataPoints.length; i++){ datapoints.push(new Datapoint(dt.dataPoints[i]));}
      actionpoints = [];
      for(i = 0; i < dt.actionPoints.length; i++){ actionpoints.push(new Actionpoint(dt.actionPoints[i]));}
      $("#testingName").html("(<i><b>" + fileName.split(".")[0] + "</b></i>)");
      if(typeof dt.imageUrl === "undefined") imageUrl = ""; else imageUrl = dt.imageUrl;
      if(typeof dt.frequency === "undefined") frequency = 1; else frequency = dt.frequency;
      if(typeof dt.activePoll === "undefined") activePoll = false; else activePoll = dt.activePoll;
      if(typeof dt.testMode ==="undefined") testMode = "Form"; else testMode = dt.testMode;
      if(typeof dt.Debug === "undefined") testDebug = true; else testDebug = dt.debug;
      if(typeof dt.testDescription === "undefined") testDescription = ""; else testDescription = dt.testDescription;
      if(typeof dt.testProject === "undefined") testProject = "";
      else{testProject = dt.testProject;}
      $("#testMode").val(testMode);
      testingFile = fileName;
      showTesting();
      if(callback) {callback();}
    });
  }

  function showTesting(){
    switch(testMode){
      case "Image": showDataImage(imageUrl); break;
      case "Form": showDataChart(); break;
    }
  }

  function showTestingProperties() {
    // #muet! needs styling - in general, need testing.css for styling in general
    var html = "";
    html +=     '<table id="testingPropertiesTab" width="100%" border="0" cellspacing="0" cellpadding="3">';
    html +=       '<tr><th width="25%">Description</th>';
    html +=         '<th width="75%"><textarea id="testDescription"';
    html +=           ' cols="35" rows="3"></textarea></th></tr>';
    html +=       '<tr><th title="optional .jpg file in testing folder">Image .jpg</th><th id="imageUrl">';
    html += Espruino.Plugins.Project.loadDirHtml(html,"testing","JPG",
                      '<select id="imageUrlList"><option>- none -</option>',
                      '<option>$name',
                      '</select>',
                    function(html){
      html +=       '</th></tr>';
      html +=     '<tr><th>Interval (secs)</th><th><input type="text" size="5" id="testingFrequency"></th></tr>';
      html +=     '<tr><th>Active Poll</th><th><input type="checkbox" id="testPollActive"></th></tr>';
      html +=     '<tr><th title="optional .js file in projects folder">Project .js</th><th id="projectUrl">';
      html += Espruino.Plugins.Project.loadDirHtml(html,"projects","JS",
                      '<select id="projectUrlList"><option>- none -</option>',
                      '<option>$name',
                      '</select>',
                    function(html){
        html +=     '</th></tr>';
        html +=     '<tr><th>Debug mode</th><th><input type="checkbox" id="testDebug"></th></tr>';
        if (!polling) {
          html +=   '<tr><th colspan="2" style="border-top:1px #CFCFCF solid;"><button id="hideAndStoreTestingPropertiesBtn">OK</button></th></tr>';
        }
        html += '</table>';
        Espruino.Core.App.openPopup({
          position: "relative",
          title: "Testing Properties" + ((polling) ? " (view only)" : ""),
          id: "testingPropertiesList",contents: html
        });
        setTimeout(function(){
          $("#testDescription").val(testDescription);
          $("#imageUrlList").val((imageUrl == "") ? "- none -" : imageUrl);
          $("#testingFrequency").val(frequency);
          $("#testPollActive")[0].checked = activePoll;
          $("#projectUrlList").val((testProject == "") ? "- none -" : testProject + ".js");
          $("#testDebug")[0].checked = testDebug;
          if (!polling) { $("#hideAndStoreTestingPropertiesBtn").unbind().click(hideAndStoreTestingProperties); }
        },100);
      }); // /loadDirHTML callback for .js for project
    }); // /loadDirHTML callback for .jpg for image
  }

  function hideAndStoreTestingProperties(){
    var val;
    testDescription = $("#testDescription").val();
    imageUrl = ((val = $("#imageUrlList").val()) == '- none -') ? "" : val;
    frequency = $("#testingFrequency").val();
    activePoll = $("#testPollActive")[0].checked;
    testProject = ((val = $("#projectUrlList").val()) == '- none -') ? "" : val.split(".")[0];
    testDebug = $("#testDebug")[0].checked;
    Espruino.Core.App.closePopup();
  }

  function switchLogging(){
    if(polling){notification("W","nsl");this.checked = testLogging;}
    else{testLogging = this.checked;}
  }

  function openTestingLog(){
    var url = "data/app/openTestingLog.html?entry=" + Espruino.Config.projectEntry.split(":")[0];
    url += "&directory=" + Espruino.Config.projectEntry.split(":")[1];
    chrome.app.window.create(url, {innerBounds: {width: 620,height: 430}});
  }

  function showActionPoints(){
    var i,html = "";
    html += '<table boder="1" id="actionTable">';
    for(i = 0; i < actionpoints.length; i++){
      html += actionpoints[i].getHtmlEdit(i);
    }
    html += '</table>';
    $("#testingAction").html(html);
    $(".alterActionPoint").click(copyAP2input);
    $(".dropActionPoint").button({ text:false, icons:{ primary: "ui-icon-minus"}}).unbind().click(dropActionPoint);
    $(".executeActionPoint").button({ text:false, icons: { primary: "ui-icon-play"} }).unbind().click(runActionPoint);
    $("#testingSetClear").button({ text:false, icons:{primary:"ui-icon-minusthick"}}).unbind().click(dropAllAction);
    $("#testingAddAction").button({ text:false, icons: { primary: "ui-icon-circle-plus"} }).unbind().click(addActionPoint);
  }

  function dropAllAction(){
    if(!polling){
      actionpoints = [];
      $("#testingAction").html("");
    }
    else {notification("W","nrm");}
  }

  function dropActionPoint(){
    if(!polling){
      actionpoints.splice($(this).attr("i"),1);
      showActionPoints();
    }
    else {notification("E","nrm");}
  }

  function runActionPoint(){
    // if (polling) { #jj? why restrict - #muet?
      actionpoints[$(this).attr("i")].assign();
    // } else {
    //  notification("W","orm");
    // }
  }

  function addActionPoint(){
    var i,label = replaceNonAlphaNumeric($("#actionName").val());
    if(!polling){
      i = actionPointExists(label);
      if(i){ notification("I","apc");actionpoints[i].update($("#actionExpression").val(),$("#actionType").val());}
      else{ actionpoints.push(new Actionpoint({label:label,expression:$("#actionExpression").val(),type:$("#actionType").val()}));}

      showActionPoints();
    }
    else {notification("W","nrm");}
  }

  function actionPointExists(label){
    var i;
    for(i = 0; i < actionpoints.length; i++){
      if(actionpoints[i].label === label) return i;
    }
    return false;
  }

  function copyAP2input(){
    var t = $(this)[0];
    $("#actionName").val(t.innerText);
    $("#actionExpression").val(t.title.split("\n")[0]);
    $("#actionType").val(t.title.split("\n")[1]);
  }

  function showDataPoints(){
    var i,html = "",ds;
    html += '<table border="1" id="detailsTable">';
    if(datapoints.length === 0){
      datapoints.push(new Datapoint({label:"Time",expression:"getTime()",type:"number"}));
      datapoints.push(new Datapoint({label:"FreeMemory",expression:"process.memory().free",type:"number"}));
    }
    for(i = 0;i < datapoints.length; i++){html += datapoints[i].getHtmlEdit(i);}
    html += '</table>';
    $("#testingTable").html(html);
    $(".alterDataPoint").click(copyDP2input);
    $(".dropDataPoint").button({ text:false, icons:{primary: "ui-icon-minus"}}).unbind().click(dropDataPoint);
    $("#testingExpressionClear").button({ text:false, icons:{primary:"ui-icon-minusthick"}}).unbind().click(dropAllDataPoints);
    $("#testingExpressionReset").button({ text:false, icons:{primary:"ui-icon-seek-first"}}).unbind().click(resetAllDataPoints);
    $("#testingAdd").button({ text:false, icons: { primary: "ui-icon-circle-plus"} }).unbind().click(addDataPoint);
  }

  function dropDataPoint(){
    if(!polling){
      datapoints.splice($(this).attr("i"),1);
      showDataPoints();
    }
    else{notification("W","nrm")}
  }

  function dropAllDataPoints(){
    if(!polling){
      datapoints = [];
      showDataPoints();
    }
    else{notification("W","nrm")}
  }

  function resetAllDataPoints(){
    if(!polling){
      for(var i = 0; i < datapoints.length; i++){
        datapoints[i].reset();
      }
      showFlotCharts();
    }
    else{notification("W","nrm")}
  }

  function addDataPoint(){
    var i,label = replaceNonAlphaNumeric($("#testingLabel").val());
    if(!polling){
      i = dataPointExists(label);
      if(i){ notification("I","dpc");datapoints[i].update($("#testingExpression").val(),$("#testingType").val()); }
      else { datapoints.push(new Datapoint({label:label,expression:$("#testingExpression").val(),type:$("#testingType").val()}));}
      showDataPoints();
    }
    else{notification("W","nrm")}
  }

  function dataPointExists(label){
    var i;
    for(i = 0; i < datapoints.length; i++){
      if(datapoints[i].label === label) return i;
    }
    return false;
  }

  function copyDP2input(){
    var t = $(this)[0];
    $("#testingLabel").val(t.innerText);
    $("#testingExpression").val(t.title.split("\n")[0]);
    $("#testingType").val(t.title.split("\n")[1]);
  }

  function showDataImage(url){
    var el,t,h,w;
    t = $("#testingForm");
    t.html("");
    $.get("data/testing_image.html",function(data){
      t.html(data);
      setTimeout(function(){
        h = t[0].clientHeight;w = t[0].clientWidth;
        $("#divImage").css({"height":h + "px","width":w + "px"});
        Espruino.Plugins.Project.loadDataUrl("testing/" + url,showImage);
      },50);
    },"html");
    function showImage(dataUrl){
      var c,img;
      img = $("#testingImage")[0];
      img.src = dataUrl;
      overlay = new imageOverlay('#overlayCanvas');
      overlay.clear();
      overlay.bind();
    }
  }

  function showDataChart(){
    $.get("data/testing_form.html",function(data){
      $("#testingForm").html(data);
      showDataPoints();
      showActionPoints();
      showFlotCharts();
      $("#testMode").unbind().change(function(){
        switch($("#testMode").val()){
          case "Image":
            if(imageUrl !== "" && imageUrl !== null){testMode = "Image";showTesting();}
            else{
              notification("W","nid");
              $("#testMode").val(testMode);
            }
            break;
          case "Form":
            testMode = "Form";
            showTesting();
            break;
        }
      });
    },"html");
  }

  function assignImageXYtoTestingItem(x,y){
    var i,html = "";
    html = "Please assign click to datapoint or action";
    html += '<table width="100%" border="1"><tr><th colspan="3" align="center">Datapoints</th></tr>';
    for(i = 0; i < datapoints.length;i++){ html += datapoints[i].getSetxyHtml(i); }
    html += '<tr><th colspan="3" align="center">Actions</th></tr>';
    for(i = 0; i < actionpoints.length;i++){ html += actionpoints[i].getSetxyHtml(i); }
    html += '</table>';
    Espruino.Core.App.openPopup({
      position: "relative",title: "Assign to Item",id: "pointList",contents: html
    });
    setTimeout(function(){
      var i;
      for(i = 0; i < datapoints.length;i++){
        if(datapoints[i].display){$("#DPid_" + i).val(datapoints[i].display);}
        else{$("#DPid_" + i).val("none");}
      }
      $(".dp_class").unbind().click(function(){
        i = parseInt($(this).attr("pnt"));
        datapoints[i]["x"] = x;
        datapoints[i]["y"] = y;
        datapoints[i]["display"] = $("#DPid_" + i).val();
        Espruino.Core.App.closePopup();
      });
      $(".ap_class").unbind().click(function(){
        i = parseInt($(this).attr("pnt"));
        actionpoints[i]["x"] = x;
        actionpoints[i]["y"] = y;
        Espruino.Core.App.closePopup();
      });
    },50);
  }

  function imageAction(x,y){
    var d,i,a;
    for(i = 0; i < actionpoints.length;i++){
      a = actionpoints[i];
      if(a.x !== 0){
        d = Math.sqrt((a.x-x)*(a.x-x) + (a.y-y)*(a.y-y));
        if(d<20){
          a.assign();
        }
      }
    }
  }

  function runGetExpression(){
    var s,d = new Date();
    if(Espruino.Core.Serial.isConnected()){
      $("#testingExpressionStop").button( "option", "disabled", false);
      $("#testingExpressionRun").button( "option", "disabled", true);
      Espruino.Core.Serial.write("echo(0);\n");
      if(activePoll){ pollData(); }
      polling = true;
      if(testLogging === true){
        testLoggingName = "testinglog/" + testingFile.split(".")[0] + "_" + d.getFullYear() + "_" + d.getMonth() + "_" + d.getDate();
        testLoggingName += "_" + d.getHours() + "_" + d.getMinutes() + "_" + d.getSeconds() + ".json";
        s = '[{"UTC":' + d.getTime() + ',"testing":"' + testingFile.split(".")[0] + '","dataPoints":[';
        for(var i = 0; i < datapoints.length; i++){
          if(i > 0) s += ',';
          s += '{"label":"' + datapoints[i].label + '","type":"' + datapoints[i].type + '"}';
        }
        s += ']}\n]';
        Espruino.Plugins.Project.appendFile(testLoggingName,s);
      }
    }
    else{notification("E","nc");}
  }

  function stopGetExpression(){
    if(activePoll){ clearInterval(pollPnt)};
    Espruino.Core.Serial.write("echo(1);\n");
    $("#testingExpressionStop").button( "option", "disabled", true);
    $("#testingExpressionRun").button( "option", "disabled", false);
    polling = false;
    Espruino.Core.Serial.write("echo(1);\n");
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
        case "string":
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
    setTimeout(function(){
      if($("#flotplaceholder")[0]){
        flotChart = $.plot($("#flotplaceholder"),flotData,flotOptions);
        $("#flotplaceholder").unbind().on("plothover",function(event,pos,item){
          if(item){
            $("#flottooltip").html(item.series.data[item.dataIndex][2])
            .css({top: item.pageY+5, left: item.pageX+5})
            .fadeIn(200);
          } else {$("#flottooltip").hide();}
        });
      }
    },100);
  }

  function setTestingValues(data){
    var i,j,dt,utc;
    utc = new Date().getTime();
    dt = JSON.parse(data);
    if(testLogging === true){
      Espruino.Plugins.Project.appendFile(testLoggingName,',{"UTC":' + utc + ',"data":' + data + "}\n]");
    }
    if(typeof dt === "object"){
      for(i in dt){
        for(j = 0; j < datapoints.length;j++){
          if(i === datapoints[j].label){
            datapoints[j].addValue([utc,dt[i]]);
          }
        }
      }
    }
    switch(testMode){
      case "Form":showFlotCharts();break;
      case "Image":overlay.drawPoints(dt);break;
    }
  }

  function pollData(){
    var cmd;
    cmd = "function " + intervalName + "(){"
    cmd += "var d={";
    for(var i = 0; i < datapoints.length; i++){
      if(i>0){ cmd += ","; }
      cmd += '"' + datapoints[i].label + '":' + datapoints[i].expression;
    }
    cmd += "};\n";
    cmd += "console.log(\"<<<<<\" + JSON.stringify(d) + \">>>>>\");\n";
    cmd += "}\n";
    Espruino.Core.Serial.write(cmd);
    if(pollPnt){clearInterval(pollPnt);}
    pollPnt = setInterval(function(){
      cmd = intervalName + "();\n";
      Espruino.Core.Serial.write(cmd);
    },frequency * 1000);
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

  function isInTesting() {
    return $("#divTesting").is(":visible");
  }

  Espruino.Plugins.Testing = {
    init : init
  };

}());
