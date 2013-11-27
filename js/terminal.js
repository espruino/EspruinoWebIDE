/**
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Renato Mangini (mangini@chromium.org)
Author: Luis Leao (luisleao@gmail.com)
Author: Gordon Williams (gw@pur3.co.uk)
**/

(function() {

  /* Handle newline conversions - Windows expects newlines as /r/n
     when we're saving/loading files */
  var isWindows = navigator.userAgent.indexOf("Windows")>=0;
  console.log((isWindows?"Is":"Not")+" running on Windows");
  var convertFromOS = function (chars) {
    if (!isWindows) return chars;
    return chars.replace(/\r\n/g,"\n");
  };
  var convertToOS = function (chars) {
    if (!isWindows) return chars;
    return chars.replace(/\r\n/g,"\n").replace(/\n/g,"\r\n");
  };

  
  var myLayout;
  var serial_devices=document.querySelector(".serial_devices");

  var logSuccess=function(msg) {
    console.log(msg);
  };
  var logError=function(msg) {
    Espruino.Status.setStatus(msg);
    console.log("ERR: "+msg);
  };
  
  var isInBlockly = function() {
    return $("#divblockly").is(":visible");
  };

  var getCode=function(callback) {
    var code;
    if (isInBlockly()) {
      code = "clearInterval();clearWatch();"+Blockly.Generator.workspaceToCode('JavaScript');
    } else {
      code = Espruino.codeEditor.getValue();
    }
    
    Espruino.Modules.loadModules(code, callback);
  };

  var saveFile = function(data, filename) {
    saveAs(new Blob([convertToOS(data)], { type: "text/plain" }), filename);
  };
  
  var toggleWebCam = function() {
    var window_url = window.URL || window.webkitURL;
    navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (navigator.getUserMedia) {
      navigator.getUserMedia({audio: false, video: { "mandatory" : { "minWidth":"1280","minHeight":"720" }}}, function(stream) {
        document.querySelector('video').src = window_url.createObjectURL(stream);
        $("#terminal").addClass("with_webcam");
      }, function(e) {
        console.log('onError!', e);
      });
    } 
  };

  var init=function() {
    // The central divider
    myLayout = $('body').layout({ onresize : function() { 
        $("#terminal").width($(".ui-layout-center").innerWidth()-4);
        $("#videotag").width($(".ui-layout-center").innerWidth()-4);
        $("#videotag").height($(".ui-layout-center").innerHeight() - ($("#terminaltoolbar").outerHeight()+3));

        $("#divblockly").width($(".ui-layout-east").innerWidth() - 2);
        $("#divblockly").height($(".ui-layout-east").innerHeight() - ($("#codetoolbar").outerHeight()+4));
    } });
    myLayout.sizePane("east", $(window).width()/2);
    // The code editor
    Espruino.codeEditor = CodeMirror.fromTextArea(document.getElementById("code"), {
      lineNumbers: true,matchBrackets: true,mode: "text/typescript",
      lineWrapping: true,
      showTrailingSpace: true,lint:true,
      highlightSelectionMatches: {showToken: /\w/},
      foldGutter: {rangeFinder: new CodeMirror.fold.combine(CodeMirror.fold.brace, CodeMirror.fold.comment)},
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
      extraKeys: {"Ctrl-Space": "autocomplete"}
    });

    // terminal toolbar
    $( ".refresh" ).button({ text: false, icons: { primary: "ui-icon-refresh" } }).click(refreshPorts);
    $( ".open" ).button({ text: false, icons: { primary: "ui-icon-play" } }).click(openSerial);
    $( ".close" ).button({ text: false, icons: { primary: "ui-icon-stop" } }).click(closeSerial);
    $( ".webcam" ).button({ text: false, icons: { primary: "ui-icon-person" } }).click(toggleWebCam);
    // code toolbar
    $( ".send" ).button({ text: false, icons: { primary: "ui-icon-transferthick-e-w" } }).click(function() {
      Espruino.Config.set("code", Espruino.codeEditor.getValue()); // save the code
      if (Espruino.Serial.isConnected()) {
          getCode(function (code) {
            if(Espruino.Minify.sendMinified === true){Espruino.Minify.MinifyCode(code,sendSerial);}
            else{sendSerial(code);}
            function sendSerial(data){
                console.log(data);
                Espruino.Serial.write("echo(0);\n" + data + "\necho(1);\n");
            }
          });
      }
    });
    $( ".blockly" ).button({ text: false, icons: { primary: "ui-icon-image" } }).click(function() {
        if (isInBlockly()) {
          $("#divblockly").hide();
          $("#divcode").show();
        } else {
          $("#divcode").hide();
          $("#divblockly").show();
        }

    });
    $( ".load" ).button({ text: false, icons: { primary: "ui-icon-folder-open" } }).click(function() {
      $("#fileLoader").click();
    });
    $("#fileLoader").change(function(event) {
      if (event.target.files.length != 1) return;
      var reader = new FileReader();
      reader.onload = function(event) {
        var data = convertFromOS(event.target.result);
        if (isInBlockly()) {
          Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, Blockly.Xml.textToDom(data));          
        } else { 
          Espruino.codeEditor.setValue(data);
        }
        document.getElementById('load').value = '';
      };
      reader.readAsText(event.target.files[0]);
    });
    $( ".save" ).button({ text: false, icons: { primary: "ui-icon-disk" } }).click(function() {
      if (isInBlockly()) 
        saveFile(Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(Blockly.mainWorkspace)), "code_blocks.xml");
      else
        saveFile(Espruino.codeEditor.getValue(), "code.js");
    });
    $("#terminal").css("top",  $("#terminaltoolbar").outerHeight()+"px");
    Espruino.initModules();
    
    flipState(true);
    
    refreshPorts();
    
    // get code from our config area at bootup
    Espruino.Config.get("code", function (savedCode) {
      if (savedCode) {
        Espruino.codeEditor.setValue(savedCode);
        console.log("Loaded code from storage.");
      } else {
        console.log("No code in storage.");
      }
    });
  };
  
  var addEventToElements=function(eventType, selector, listener) {
    var elems=document.querySelectorAll(selector);
    
    for (var i=0; i<elems.length; i++) {
      (function() {
        var c=i;
        elems[i].addEventListener(eventType, function(e) {
          listener.apply(this, [e, c]);
        });
      })();
    }
  };

  var convertToChars=function(i) {
    var ch=i.toString(16);
    if (ch.length==1) return "0"+ch;
    return ""+ch;
  };
  
  var flipState=function(deviceLocated) {
    $(".open").button( "option", "disabled", !deviceLocated);
    $(".close").button( "option", "disabled", deviceLocated);
  };
  
  var refreshPorts=function() {
    while (serial_devices.options.length > 0)
      serial_devices.options.remove(0);
    
    Espruino.Serial.getPorts(function(items) {
      logSuccess("got "+items.length+" ports");

      var selected = -1;

      if (isWindows) {
        // Com ports will just be COM1,COM2,etc
        // Chances are that the largest COM port is the one for Espruino:
        items.sort();
        if (items.length > 0)
          selected = items.length-1;
      } else { 
        // Everyone else probably has USB in the name (or it might just be the first device)
        for (var i=0; i<items.length; i++) {
           if (i==0 || (/usb/i.test(items[i])  && /tty/i.test(items[i]))) {
             selected = i;
           }
        }
      }

      // add to menu
      for (var i=0; i<items.length; i++) 
        serial_devices.options.add(new Option(items[i], items[i]));
      if (selected) logSuccess("auto-selected "+items[selected]);
      serial_devices.options.selectedIndex = selected;
    });
  };
  
  var openSerial=function() {
    var serialPort=serial_devices.options[serial_devices.options.selectedIndex].value;
    if (!serialPort) {
      logError("Invalid serialPort");
      return;
    }
    Espruino.Status.setStatus("Connecting");
    flipState(true);
    Espruino.Serial.open(serialPort, function(cInfo) {
      if (cInfo!=undefined) {
        logSuccess("Device found (connectionId="+cInfo.connectionId+")");
        flipState(false);        
        Espruino.Terminal.grabSerialPort();
        Espruino.Process.getProcess(setBoardConnected);
      } else {
        // fail
        flipState(true);
        Espruino.Status.setStatus("Connect Failed.");
      }
    }, function () {
      console.log("Force disconnect");
      closeSerial(); // force disconnect
    });
    function setBoardConnected(){
      Espruino.Status.setStatus("Connected");
      $("#processBoard").html(Espruino.Process.Env.BOARD);
    }
  };

  var closeSerial=function() {
    Espruino.Serial.close(function(result) {
      flipState(true);
      $("#processBoard").html("");
      Espruino.Status.setStatus("Disconnected");
      Espruino.Process.Env = {};
    });
  };
  

  
  init();
})();





