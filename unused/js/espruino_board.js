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
  /*
    
    <span id="processBoard" style="position:absolute;right:55px;top:1px;">&nbsp;</span>
          <button class="board" style="position:absolute;right:30px;top:1px;">Board Info</button>
          <button class="param">Replace Params</button>
          */
  
    // Code to load and save configuration options
    Espruino["Board"] = {};
    Espruino.Board.setBoard = setBoard;
    Espruino.Board.params = params;
    Espruino.Board.boardActive = false;
    Espruino.Board.boardEditSupport = false;
    
    var boardFolder = "http://www.espruino.com/json/";
    var boardImgFolder = "img/";
    var boardPinFolder = "data/boards/";
    var devices = {};
    var boardObject;
    var viewPoint = {};
    var params;
    var markedParam;
    
    function paramObj(param){
      var p;
      p = param.substr(2).split("*/");
      this.pin = p[1].substr(0,p[1].length - 1).trim();
      p[0] = p[0].split(",");
      this.device = p[0][0];
      this.subdevice = p[0][1];
      this.param = param;
      this.createParam = function(newValue,subDevice){
        var r;
        r = "/*" + this.device;
        if(this.subdevice){ r += "," + this.subdevice}
        r += "*/";
        if(subDevice){
          if(this.device === subDevice){ r += newValue;} else{ r += subDevice; }
        }
        else{ r += newValue; }   
        r += this.param.substr(this.param.length - 1);
        return r;
      }
    }
    Espruino.Board.init = function() {
      switchOptions();
    };
    Espruino.Board.initOptions = function() {
      Espruino.Options.optionFields.push({id:"#boardActive",module:"Board",field:"boardActive",type:"check",onLoaded:switchOptions,onBlur:true});
      Espruino.Options.optionFields.push({id:"#boardEditSupport",module:"Board",field:"boardEditSupport",type:"check",onLoaded:switchOptions,onBlur:true});      
      Espruino.Options.optionBlocks.push({module:"Board",buttonLine:2,onLoaded:switchOptions});
    };

    Espruino.Board.getBoardObject = function() {
      return boardObject;
    }

    function switchOptions(){
      if(Espruino.Board.boardActive === true){
        createBoardList();
        $(".board").button({ text: false, icons: { primary: "ui-icon-wrench" } }).hide();
        $(".param").button({ text: false, icons: { primary: "ui-icon-pin-s" } }).hide();
        if(Espruino.Board.boardEditSupport === true){
          Espruino.codeEditor.on("change",checkParam);
          Espruino.codeEditor.on("cursorActivity",selectParam);
          Espruino.codeEditor.on("contextmenu",setParam);
        }
        else{
          Espruino.codeEditor.off("change",checkParam);
          Espruino.codeEditor.off("cursorActivity",selectParam);
          Espruino.codeEditor.off("contextmenu",setParam);
        }
      }
      else{
        $(".board").hide();
        $(".param").hide();
        $("#boardList").unbind().remove();
        Espruino.codeEditor.off("change",checkParam);
        Espruino.codeEditor.off("cursorActivity",selectParam);
        Espruino.codeEditor.off("contextmenu",setParam);
      }
    }
    function setParam(cm,evt){
      var mkp,html,pins,param,selectedParam;
      var i,j,k;
      mkp = markedParam.find();
      selectedParam = cm.getRange(mkp.from,mkp.to);
      if(Espruino.Process.Env.BOARD_NAME && selectedParam.match(Espruino.General.pinRegExp)){
        evt.preventDefault();
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
        else{ln = ln.replace(selectedParam.param,selectedParam.createParam(pin,i));}
        cm.setLine(cm.getCursor().line,ln);
        $(".subform").remove();
      }  
    }
    function selectParam(cm){
      var cPos,line,params,lPos,param;
      if(markedParam){ markedParam.clear();markedParam = false;}
      if(Espruino.Process.Env.BOARD_NAME){
        cPos = cm.getCursor();
        line = cm.getLine(cPos.line);
        params = line.match(Espruino.General.pinRegExp);
        if(params){
          for(var i = 0; i < params.length; i++){
            lPos = line.indexOf(params[i]);
            if(lPos <= cPos.ch && (lPos + params[i].length) >= cPos.ch){
              markedParam = cm.doc.markText({line:cPos.line,ch:lPos},{line:cPos.line,ch:lPos + params[i].length},{className:"paramStyle"});
              param = new paramObj(params[i]);
              break;
            }
          }
        }
      }
    }
    function checkParam(){ //if board selected and replaceable parameter in source, switch button on
      if(Espruino.Board.boardActive && 
         Espruino.Process.Env.BOARD_NAME && 
         Espruino.codeEditor.getValue().match(Espruino.General.pinRegExp)){
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
      $.get(boardFolder + "boards.json",function(data){  //change back to getJSON, as soon as board.js matches JSON
        data = $.parseJSON(data.replace(/,\n\s*}/g,"\n}"));
        html = "<select id=\"boardList\">";
        html += '<option value="">select Board</option>';
        for(var i in data){
          html += '<option value="' + i + '">' + i + '</option>';
        }
        html +="</select>";
        $("#processBoard").html(html);
        $("#boardList").unbind().change(selectBoard);
        $("#boardList").click(function(){$(".subform").hide();});
      },"text").fail(function(a,b,c){console.log(a,b,c);});
    }
    function selectBoard(){ //event for change in boardlist, loads all data around board
      if(Espruino.Serial.isConnected() === true){
        Espruino.Core.Notifications.warning("Close connection first"); 
        $("#boardList").val(Espruino.Process.Env.BOARD_NAME);
      }
      else{ 
        loadBoard($(this).val());
      }
    }
    function loadBoard(boardName){ //loads boarddata from Espruino.com, merges with "my" position data
      if(boardName !== ""){
        $.getJSON(boardFolder + boardName + ".json",function(data){
          boardObject = data;
          Espruino.Process.setProcess(data);
          Espruino.Process.Env.ShortName = boardName;
          Espruino.Flasher.checkBoardInfo(data);
          mergePosition(data,boardName,getDevices);          
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
      setupBoardButton();
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
                  console.log("addPins: Can't find pin",i,j,k,pin);
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
      Espruino.General.ShowSubForm("optionsdiv",30,60,html,"#efe","body");
      $("#deviceTree").treeview({collapsed:true});
      $(".subdevice").unbind().hover(function(){hoverSubDevice($(this));}, function(){$(".pinFunction").remove(); });
      $(".paramPins").unbind().hover(function(){hoverParamPins($(this));}, function(){$(".pinFunction").remove(); });          
    }
    function hoverParamPins(thisPin){ //event hover for parameters from source shows pins
      var pins = getMatchingPins(thisPin.attr("device"),thisPin.attr("subdevice"),thisPin.attr("pindevice"));
      for(var i = 0; i < pins.length; i++){ addPinToImage(pins[i]);}
    }
    function hoverSubDevice(thisPin){ //event hover for devices / pin types
      var pins = getMatchingPins(thisPin.attr("device"),thisPin.attr("subdevice"),thisPin.attr("pindevice"));
      for(var i = 0; i < pins.length; i++){ addPinToImage(pins[i]);}      
    }
    function getMatchingPins(device,subdevice,pindevice){
      var r = [],channel,pins,device;
      device = devices[device];
      if(pindevice){
        pins = device.channel[subdevice].pins[pindevice];
        if($.isArray(pins)){ for(var i = 0; i < pins.length; i++){ r.push(pins[i]);}}
        else{r.push(pins);}
      }
      else{
        pins = device.channel[subdevice].pins;
        for(var k in pins){
          if($.isArray(pins[k])){ for(var j = 0; j < pins[k].length; j++){ r.push(pins[k][j]);}}
          else{r.push(pins[k]);}
        }
      }
      return r;
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
        }
        boardPin += '<img src="' + imgSrc + '" width=' + viewPoint.pinBall.width;
        boardPin += ' height=' + viewPoint.pinBall.height + '></div>';
        $(boardPin).appendTo("#boardDiv");  
      }
    }               
    function setupBoardButton() {
      if (Espruino.Board.boardActive)
        $(".board").show().click(openBoard);
    }
    function setBoard(val){ //set selected value in list
      $("#boardList").val(val);
      if(val === ""){ $(".board").hide(); }
      else { 
        loadBoard(val); 
        setupBoardButton();
      }
    }    
})();
