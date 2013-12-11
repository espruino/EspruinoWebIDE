/*
 * The MIT License

Copyright (c) 2013 by Juergen Marsch

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
    // Code to load and save configuration options
    Espruino["Board"] = {};
    Espruino.Board.setBoard = setBoard;
    Espruino.Board.params = params;
    Espruino.Board.boardActive = false;
    Espruino.Board.boardEditSupport = true;
    
    var boardFolder = "http://www.espruino.com/json/";
    var boardImgFolder = "img/";
    var boardPinFolder = "data/boards/";
    var devices = {};
    var boardObject;
    var viewPoint = {};
    var params;

    function paramObj(param){
      var p;
      p = param.substr(2).split("*/");
      this.pin = p[1].substr(0,p[1].length - 1).trim();
      p[0] = p[0].split(",");
      this.device = p[0][0];
      this.subdevice = p[0][1];
      this.param = param;
      this.createParam = function(newValue){
        var r;
        r = "/*" + this.device;
        if(this.subdevice){ r += "," + this.subdevice}
        r += "*/" + newValue + this.param.substr(this.param.length - 1);
        return r;
      }
    }
    Espruino.Board.init = function() {
      switchOptions();
    };
    Espruino.Board.initOptions = function(){
      Espruino.Options.optionFields.push({id:"#boardActive",module:"Board",field:"boardActive",type:"check"});
      Espruino.Options.optionFields.push({id:"#boardEditSupport",module:"Board",field:"boardEditSupport",type:"check"});      
      Espruino.Options.optionBlocks.push({id:"#divOptionBoard",htmlUrl:"data/Espruino_Board.html",onLoaded:switchOptions});
    }
    function switchOptions(){
      if(Espruino.Board.boardActive === true){
        createBoardList();
        $(".board").button({ text: false, icons: { primary: "ui-icon-wrench" } }).hide();
        $(".param").button({ text: false, icons: { primary: "ui-icon-pin-s" } }).hide();
        $("#boardList").unbind().change(selectBoard);
        $("#boardList").click(function(){$(".subform").hide();});
        if(Espruino.Board.boardEditSupport === true){
          Espruino.codeEditor.on("change",checkParam);
          Espruino.codeEditor.on("cursorActivity",selectParam);
          Espruino.codeEditor.on("dblclick",setParam);
        }
      }
      else{
        $(".board").hide();
        $(".param").hide();
        $("#boardList").unbind().remove();
        Espruino.codeEditor.off("change");
        Espruino.codeEditor.off("cursorActivity");
        Espruino.codeEditor.off("dblclick");
      }
    }
    function setParam(cm,evt){
      var html,pins,param,selectedParam = cm.getSelection();
      var i,j,k;
      if(Espruino.Process.Env.BOARD && selectedParam.match(Espruino.General.pinRegExp)){
        selectedParam = new paramObj(selectedParam);
        params = splitParams(Espruino.codeEditor.getValue().match(Espruino.General.pinRegExp));
        html = '<div id="boardDiv" class="subform" style="position:relative">';
        html += '<img src="' + boardImgFolder + Espruino.Process.Env.ShortName + '.jpg"';
        html += 'width=' + viewPoint.width + ' height=' + viewPoint.height + '></div>';
        Espruino.General.ShowSubForm("optionsdiv",30,200,html,"#efe","body");
        for(i in devices[selectedParam.device].channel){
          if(devices[selectedParam.device].channel[i].pins[selectedParam.subdevice]){
            addPinToImage(devices[selectedParam.device].channel[i].pins[selectedParam.subdevice]);
          }
          else{
            for(j in devices[selectedParam.device].channel[i].pins){
              pins = devices[selectedParam.device].channel[i].pins[j];
              if($.isArray(pins)){for(k = 0; k < pins.length; k++){ addPinToImage(pins[k]);}}
              else{addPinToImage(devices[selectedParam.device].channel[i].pins[j]);}
            }
          }
        }
        $(".pinFunction").unbind().click(changeParam);
      }
      function changeParam(evt){
        var i,j,k,pin,device,channel,pins;
        pin = $(this).attr("pin");
        device = devices[selectedParam.device];
        for(i in device.channel){
          pins = device.channel[i].pins;
          if(pins[selectedParam.subDevice]){
            if(pins[selectedParam.subDevice].pin === pin){changeSource(i,pin);}
          }
          else{
            for(j in pins){
              if($.isArray(pins[j])){
                for(k = 0; k < pins[j].length; k++){
                  if(pins[j][k].pin === pin){changeSource(i,pin);}
                }  
              }
              else {if(pins[j].pin === pin){changeSource(i,pin); }}
            }
          }
        }
      }
      function changeSource(i,pin){
        var ln = cm.getLine(cm.getCursor().line);
        if(selectedParam.subdevice){ln = ln.replace(selectedParam.param,selectedParam.createParam(pin));}
        else{ln = ln.replace(selectedParam.param,selectedParam.createParam(i));}
        cm.setLine(cm.getCursor().line,ln);
        $(".subform").remove();
      }  
    }
    function selectParam(cm){
      var cPos,line,params,lPos,param;
      cPos = cm.getCursor();
      line = cm.getLine(cPos.line);
      params = line.match(Espruino.General.pinRegExp);
      if(params){
        for(var i = 0; i < params.length; i++){
          lPos = line.indexOf(params[i]);
          if(lPos <= cPos.ch && (lPos + params[i].length) >= cPos.ch){
            cm.setSelection({line:cPos.line,ch:lPos},{line:cPos.line,ch:lPos + params[i].length});
            param = new paramObj(params[i]);
            break;
          }
        }
      }
    }
    function checkParam(){ //if board selected and replaceable parameter in source, switch button on
      if(Espruino.Process.Env.BOARD && Espruino.codeEditor.getValue().match(Espruino.General.pinRegExp)){
        $(".param").show().click(replaceParam);
      }
      else{
          $(".param").unbind().hide();
      }
    }
    function replaceParam(){ //opens table with parameter from source 
      var html,param;
      params = splitParams(Espruino.codeEditor.getValue().match(Espruino.General.pinRegExp));
      html = '<table border="1"><tr><th>device</th><th>type</th><th>Assigned</th></tr>';
      for(var i = 0; i < params.length; i++){
        param = params[i];
        html += '<tr class="parampin" param="' + param.param + '">';
        html += '<td>' + param.device + '</td><td>' + param.subdevice + '</td><td>' + param.pin + '</td></tr>';
      }
      html += '</table>';
      Espruino.General.ShowSubForm("paramsdiv",30,300,html,"#efe","body");
      $(".parampin").unbind().hover(selectParamInEditor);
    }
    function splitParams(params){ //splits all parameters into object
      var r = [];
      if(params){
        for(var i = 0; i < params.length; i++){r.push(new paramObj(params[i]));}
      }
      return r;
    }
    function selectParamInEditor(evt){ //event for mouseover in parameter table
      var start,end,
          param = $($(this)[0].attributes["param"]).val();
      if(evt.originalEvent.type === "mouseout"){
        Espruino.codeEditor.setCursor({line:0,ch:0});
      }
      else{
        for(var i = 0; i < Espruino.codeEditor.lineCount(); i++){
          start = Espruino.codeEditor.getLine(i).indexOf(param);
          if(start > 0){
            end = start + param.length;
            Espruino.codeEditor.setSelection({line:i,ch:start},{line:i,ch:end});
            break;
          }
        }  
      }
    }
    function createBoardList(){ //create list of boards, hardcoded until a better way
      var html;
      html = "<select id=\"boardList\">";
      html +="<option value=\"\">select Board</option>";
      html +="<option value=\"ESPRUINOBOARD\">ESPRUINOBOARD</option>";
      html +="<option value=\"HYSTM32_24\">HYSTM32_24</option>";
      html +="<option value=\"HYSTM32_28\">HYSTM32_28</option>";
      html +="<option value=\"HYSTM32_32\">HYSTM32_32</option>";
      html +="<option value=\"OLIMEXINO_STM32\">OLIMEXINO_STM32</option>";
      html +="<option value=\"STM32F3DISCOVERY\">STM32F3DISCOVERY</option>";
      html +="<option value=\"STM32F4DISCOVERY\">STM32F4DISCOVERY</option>";
      html +="<option value=\"STM32VLDISCOVERY\">STM32VLDISCOVERY</option>";
      html +="</select>";
      $("#processBoard").html(html);
    }
    function selectBoard(){ //event for change in boardlist, loads all data around board
      if(Espruino.Serial.isConnected() === true){
        Espruino.Status.setStatus("Close connection first"); 
        $("#boardList").val(Espruino.Process.Env.BOARD);
      }
      else{ 
        loadBoard($(this).val());
      }
    }
    function loadBoard(val){ //loads boarddata from Espruino.com, merges with "my" position data
      if(val !== ""){
        $.getJSON(boardFolder + val + ".json",function(data){
          boardObject = data;
          Espruino.Process.setProcess(data);
          Espruino.Process.Env.ShortName = val;
          mergePosition(data,val,getDevices);
          checkParam();
        });
      }
      else{
        devices = {};
        $(".board").hide();
        Espruino.Process.setProcess({});
        checkParam();
      }
    }
    function mergePosition(data,board,callback){ //merges position data into pin data
      $.getJSON(boardPinFolder + board + ".json",function(boardData){
        viewPoint = boardData.viewPoint;
        for(var i = 0; i < data.pins.length; i++){
          for(var j = 0; j < boardData.pins.length; j++){
            if(data.pins[i].name === boardData.pins[j].pin){
              data.pins[i].top = boardData.pins[j].top;
              data.pins[i].left = boardData.pins[j].left;
              data.pins[i].layout = boardData.pins[j].layout;
              break;
            }
          }
        }
        callback(data);
      });
    }
    function getDevices(data){ //transfers data into internal structur 
      var device,i;
      devices = {};
      addDevices(data.devices);
      addDevices(data.peripherals);
      addSubDevices(data.devices);
      addSubDevices(data.peripherals);
      addPins(data.pins);
      addDevicesPins(data.devices,data.pins);
      $(".board").show().click(openBoard);
      function addDevices(d){
        var device;
        for(var i in d){
          if($.isNumeric(i.substr(i.length-1))){device = i.substr(0,i.length-1);}else{device = i;}
          if(device !== "DEVICE" && !devices[device]){ devices[device] = {channel:{}}; }
        }
      }
      function addSubDevices(d){
        var device;
        for(var i in d){
          if($.isNumeric(i.substr(i.length-1))){device = i.substr(0,i.length-1);} else{ device = i;}
          if(device !== "DEVICE"){devices[device].channel[i] = {pins:{}}; }
        }
      }
      function addDevicesPins(d,p){
        var pin,pinData;
        for(var i in d){
          if($.isNumeric(i.substr(i.length-1))){device = i.substr(0,i.length-1);} else{ device = i;}
          for(var j in d[i]){
            pin = j.split("_");
            pinData = {};
            if(pin.length > 1){ pinData[pin[1]] = d[i][j];} else{ pinData[pin[0]] = d[i][j]; }
            for(var k = 0; k < p.length; k++){
              if(d[i][j] === p[k].name){ pinData = {pin:p[k].name,top: p[k].top,left: p[k].left}; }
            }
            if(pin.length>1){devices[device].channel[i].pins[pin[1]] = pinData;}
            else{devices[device].channel[i].pins[pin[0]] = pinData;}
          }
        }        
      }
      function addPins(d){
        var pin;
        for(var i = 0; i < d.length; i++){
          for(var j in d[i].simplefunctions){
            if(j !== "DEVICE"){
              for(var k in d[i].simplefunctions[j]){
                pin = d[i].simplefunctions[j][k].split("_");
                if(devices[j].channel[pin[0]]){
                  devices[j].channel[pin[0]].pins[pin[1]] = {pin:d[i].name,top:d[i].top,left:d[i].left};
                }
                else if(devices[j].channel[j]){
                  if(!devices[j].channel[j].pins.pin){devices[j].channel[j].pins.pin = [];}
                  if($.inArray(d[i].name,devices[j].channel[j].pins.pin) < 0){
                    devices[j].channel[j].pins.pin.push({pin:d[i].name,top:d[i].top,left:d[i].left});
                  }
                }
                else{
                  console.log("watt nu",i,j,k,pin);
                }
              }
            }
          }
        }
      }
    }
    function openBoard(){ //creates a div to handle boarddata
      var html,param;
      params = splitParams(Espruino.codeEditor.getValue().match(Espruino.General.pinRegExp));
      html = '<table border="1">';
      html += '<tr><td valign="top"><ul class="filetree" id="deviceTree">';
      if(params){
        html += '<li><span>Pins in use</span>';
        html += '<ul>';
        for(var i = 0; i < params.length; i++){
          param = params[i];
          html += '<li><span class="paramPins"';
          if(param.pin){ html += ' device="' + param.device + '" subdevice="' + param.subdevice + '" pindevice="' + param.pin + '">' + param.pin;}
          else{ html += ' device="' + param.device + '" subdevice="' + param.subdevice + '">' + param.subdevice;}
          html += '</span></li>';
        }
        html += '</ul>';
      }
      for(var i in devices){
        html += '<li>' + i;
        html += '<ul>';
        for(var j in devices[i].channel){
          html += '<li><span class="subdevice" device="' + i + '" subdevice="' + j + '">' + j + '</span>';
          html += '<ul>';
          for(var k in devices[i].channel[j].pins){
            html += '<li><span class="subdevice" device="' + i + '" subdevice="' + j + '" pindevice="' + k + '">' + k + '</span></li>';
          }
          html += '</ul></li>';
        } 
        html += '</ul></li>';
      }
      html += '</ul></td>';
      html += '<td><div id="boardDiv" style="position:relative">';
      html += '<img src="' + boardImgFolder + Espruino.Process.Env.ShortName + '.jpg"';
      html += 'width=' + viewPoint.width + ' height=' + viewPoint.height + '></div></td>';
      html += '</tr></table>';
      Espruino.General.ShowSubForm("optionsdiv",30,200,html,"#efe","body");
      $("#deviceTree").treeview({collapsed:true});
      $(".subdevice").unbind().hover(function(){hoverSubDevice($(this));}, function(){$(".pinFunction").remove(); });
      $(".paramPins").unbind().hover(function(){hoverParamPins($(this));}, function(){$(".pinFunction").remove(); });          
    }
    function hoverParamPins(thisPin){ //event hover for parameters from source shows pins
      var d,pinFound = false;
      var device = thisPin.attr("device"), subDevice = thisPin.attr("subdevice"), pinDevice = thisPin.attr("pindevice");
      for(var i = 0; i < boardObject.pins.length; i++){
        if(pinDevice === boardObject.pins[i].name){
          pinFound = true;
          addPinToImage(boardObject.pins[i]);
          break;
        }
      }
      if(!pinFound){
        d = devices[device].channel[subDevice].pins;
        for(var p in d){
           addPinToImage(d[p]);
        }
      }
    }
    function hoverSubDevice(thisPin){ //event hover for devices / pin types
        if(thisPin.attr("pindevice")){
          addPinsToImage(devices[thisPin.attr("device")].channel[thisPin.attr("subdevice")].pins[thisPin.attr("pindevice")]);
        }
        else{
          var pins = devices[thisPin.attr("device")].channel[thisPin.attr("subdevice")].pins;
          for(var k in pins){
            addPinsToImage(pins[k]);
          }
        }      
    }
    function addPinsToImage(pin){ //add all selected pins to image of board
      if($.isArray(pin)){ for(var i = 0; i < pin.length; i++){ addPinToImage(pin[i]); } }
      else{ addPinToImage(pin); }
    }
    function addPinToImage(pin){ //add pin to image on board
      var boardPin,pins,imgSrc = "img/circle_yellow.png";
      if(pin.top){
        boardPin = '<div class="pinFunction" pin="' + pin.pin + '" style="position:absolute; z-index:5;';
        boardPin += ' top:' + pin.top + 'px; left:' + pin.left + 'px;">';
        for(var i = 0; i < params.length; i++){
          if(params[i].pin){ if(params[i].pin === pin.pin){ imgSrc = "img/circle_tan.png";} }
          else{
            pins = devices[params[i].device].channel[params[i].subdevice].pins;
            for(var j in pins){
              if(pins[j].pin === pin.pin){ imgSrc  = "img/circle_tan.png"; break;}
            }
          }
        }
        boardPin += '<img src="' + imgSrc + '" width=' + viewPoint.pinBall.width + ' height=' + viewPoint.pinBall.height + '></div>';
        $(boardPin).appendTo("#boardDiv");  
      }
    }               
    function setBoard(val){ //set selected value in list
      $("#boardList").val(val);
      if(val === ""){ $(".board").hide(); }
      else{ loadBoard(val); $(".board").show().click(openBoard); }
    }
})();
