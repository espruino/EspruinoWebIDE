/*
 * The MIT License

Copyright (c) 2013 by Gordon Williams

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
"use strict";
(function(){
  // <button class="display">Display</button>
  
    // simple data logger
    Espruino["Display"] = {};
    Espruino.Display.displayActive = false;
    Espruino.Display.displayTimeout = 5000;
    Espruino.Display.displayMode = "wait";
    Espruino.Display.startMarker = ">>>";
    Espruino.Display.endMarker = "<<<";
    
    var displayOn = false;
    var datapoints = [];
    var prevReader;
    var endMarker = "<<<";
    var startMarker = ">>>";
    var intervalName = "displayPoll";
    
    function datapoint(label){
      this.label = label;
      this.points = [0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    }
    
    Espruino.Display.init = function(){
      switchDisplay();
    };
    Espruino.Display["initOptions"] = function(){
      Espruino.Options.optionFields.push({id:"#displayActive",module:"Display",field:"displayActive",type:"check",onLoaded:switchDisplay,onBlur:true});
      Espruino.Options.optionFields.push({id:"#displayTimeout",module:"Display",field:"displayTimeout",type:"text"});
      Espruino.Options.optionFields.push({id:"#displayMode",module:"Display",field:"displayMode",type:"radio",options:["wait","poll"]});
      Espruino.Options.optionFields.push({id:"#displayStartMarker",module:"Display",field:"startMarker",type:"text"});
      Espruino.Options.optionFields.push({id:"#displayEndMarker",module:"Display",field:"endMarker",type:"text"});
      Espruino.Options.optionBlocks.push({module:"Display",buttonLine:2});
    };
    function switchDisplay(){
      if(Espruino.Display.displayActive){
        $(".display").button({ text: false, icons: { primary: "ui-icon-calculator" } }).show();
        $(".display").click(showForm);
      }
      else{
        $(".display").unbind().hide();
        displayOn = false;
      }
    }
    function showForm(){
      var html = "",i;
      html += '<table width="100%"><tr>'
      html += '<th align="left"><button class="runDisplay">start</button><button class="stopDisplay">stop</button></th>';
      html += '<th align="right"><button class="exitDisplay">exit</button></th></tr></table>';
      html += 'Waiting<input type="radio" class="displayMode" name="displayMode" value="wait">';
      html += ' Polling<input type="radio" class="displayMode" name="displayMode" value="poll" checked><br>';
      html += '<table border="1" id="detailsTable">';
      if(datapoints.length > 0){
        for(i = 0;i < datapoints.length; i++){
          html += '<tr>';
          html += '<th>' + datapoints[i].label + '</th>';
          html += '<th><span id="datapoint_' + i.toString() + '"></span></th>';
          html += '<th><span id="sparkline_' + i.toString() + '"</th>';
          html += '<th><button class="dropDatapoint" i="' + i.toString() + '">Drop</button>';
          html += '<tr>';
        }
      }
      html += '<tr>';
      html += '<th><input id="newLabel" type="text"></th>';
      html += '<th><button class="addDatapoint">Add</button>';
      html += '</tr>';
      html += '</table>';
      Espruino.General.ShowSubForm("displayTable",50,100,html,"#8888ff","body","displayForm");
      $(".runDisplay").button({ text:false, icons: { primary: "ui-icon-play"} }).click(runDisplay);
      $(".stopDisplay").button({ text:false, icons: { primary: "ui-icon-stop"} }).click(stopDisplay);
      $(".stopDisplay").button('option','disabled', true);
      $(".exitDisplay").button({ text:false, icons: { primary: "ui-icon-close"} }).click(exitDisplay);
      $(".addDatapoint").button({ text:false, icons: { primary: "ui-icon-plusthick"} }).click(addDatapoint);
      $(".dropDatapoint").button({ text:false, icons: { primary: "ui-icon-trash"} }).click(dropDatapoint);
    }
    function addDatapoint(e){
      datapoints.push(new datapoint($("#newLabel").val()));
      showForm();
    }
    function dropDatapoint(e){
      datapoints.splice($(this).attr("i"),1);
      showForm();
    }
    function runDisplay(e){
      if(Espruino.Serial.isConnected()){
        switch($(".displayMode").filter(":checked").val()){
          case "wait":waitData();break;
          case "poll":pollData();break;
        }
        $(".stopDisplay").button( "option", "disabled", false);
        $(".runDisplay").button( "option", "disabled", true);
      }
      else{Espruino.Core.Notifications.error("not connected");}
    }
    function stopDisplay(e){
      Espruino.Serial.write('\x03clearInterval(' + intervalName + ');\ndelete ' + intervalName + ';\necho(1);\n')
      if(prevReader){Espruino.Serial.startListening(prevReader)};
        $(".stopDisplay").button( "option", "disabled", true);
        $(".runDisplay").button( "option", "disabled", false);
    }
    function exitDisplay(e){
      stopDisplay();
      $("#displayTable").remove();
    }     
    function pollData(){
      var cmd = "var " + intervalName + "=setInterval(function(){var d=[";
      for(var i = 0; i < datapoints.length; i++){
        if(i>0){ cmd += ","; }
        cmd += datapoints[i].label;
      }
      cmd += "];";
      cmd += "console.log(\"" + Espruino.Display.startMarker + "\" + JSON.stringify(d) + \"" + Espruino.Display.endMarker + "\");";
      cmd += "}," + Espruino.Display.displayTimeout + ");";
      Espruino.Serial.write('\x03echo(0);\n' + cmd + '\n');
      waitData();
    }
    function waitData(){
      var bufText = "",varStart = 0, varEnd = 0, dataset,i;
      prevReader = Espruino.Serial.startListening(function (readData){
        var bufView = new Uint8Array(readData);
        for(i = 0; i < bufView.length; i++){
          bufText += String.fromCharCode(bufView[i]);
        }
        varStart = bufText.indexOf(Espruino.Display.startMarker);
        varEnd = bufText.indexOf(Espruino.Display.endMarker);
        if(varEnd > 0){
          dataset = JSON.parse(bufText.substring(varStart + Espruino.Display.startMarker.length,varEnd));
          for(i = 0; i < dataset.length; i++){
            datapoints[i].points.shift();
            datapoints[i].points.push(dataset[i]);
            $("#sparkline_" + i.toString()).sparkline(datapoints[i].points);
            $("#datapoint_" + i.toString()).html(dataset[i].toString());
          }
          bufText = bufText.substr(varEnd + Espruino.Display.endMarker.length);
        }
      });
    }
})();
