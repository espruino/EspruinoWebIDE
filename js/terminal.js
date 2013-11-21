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

  var displayTimeout = null;
  var displayData = [];
  
  var termText = [ "" ];
  var termCursorX = 0;
  var termCursorY = 0;
  var termControlChars = [];
  
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

  var getModulesRequired = function(code) {
    var modules = [];
    var requires = code.match(/require\(\"[^\"]*\"\)/g);
    for (i in requires) { 
      // strip off beginning and end, and parse the string
      var module = JSON.parse(requires[i].substring(8,requires[i].length-1));
      // add it to our array
      modules.push(module);
    }    
    return modules;
  };

  var getCode=function(callback) {
    var code;
    if (isInBlockly()) {
      code = "clearInterval();clearWatch();"+Blockly.Generator.workspaceToCode('JavaScript');
    } else {
      code = Espruino.codeEditor.getValue();
    }
    
    var requires = getModulesRequired(code);    
    var moduleCode = ["Modules.removeAllCached();"];
    var getModule = function (moduleName) {      
      console.log("Getting module '"+moduleName+"'");
      $.get("http://www.espruino.com/modules/"+moduleName+".min.js", function( moduleContents ) {
        console.log("Got module '"+moduleName+"'");
        moduleCode.push("Modules.addCached("+JSON.stringify(moduleName)+", "+JSON.stringify(moduleContents)+");\n");
        Espruino.Status.incrementProgress(1);
        if (--n == 0) {
          Espruino.Status.setStatus("Done.");
          finished();
        }
      }, 'text');
    };
    var finished = function() {      
      callback(moduleCode.join("\n")+code);
    };
    var n = requires.length;
    if (n==0) finished();
    else Espruino.Status.setStatus("Loading Modules...", n); 
    for (i in requires) getModule(requires[i]);
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
      if (serial_lib.isConnected()) {
          getCode(function (code) { 
            var toSend = "echo(0);\n"+code+"\necho(1);\n";
            console.log(toSend);
            serial_lib.write(toSend);
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
/*  $( ".flash" ).button({ text: false, icons: { primary: "ui-icon-star" } }).click(function() {
      Espruino.Flasher.flashDevice(serial_lib, "espruino_r1v1_1v42.bin",function (err) {
        serial_lib.startListening(onRead); // reset listener
        if (err) {
          Espruino.Status.setStatus("Error Flashing.");
          console.log(err);
          //alert(err);
       } else Espruino.Status.setStatus("Done.");
      });
    }); */
    $("#terminal").css("top",  $("#terminaltoolbar").outerHeight()+"px");
    Espruino.initModules();

    flipState(true);
    
    $("#terminal").mouseup(function() {
      var terminalfocus = $('#terminalfocus');
      var selectedText = window.getSelection().toString();
      if (selectedText.length > 0) {               
        //console.log(selectedText);
        //console.log(selectedText.split("").map(function(c) { return c.charCodeAt(0); }));    
        selectedText = selectedText.replace(/\xA0/g," "); // Convert nbsp chars to spaces
        //console.log(selectedText.split("").map(function(c) { return c.charCodeAt(0); }));
        terminalfocus.val(selectedText).select();
        document.execCommand('copy');
        terminalfocus.val('');
      }
      terminalfocus.focus(); 
    });
    $("#terminalfocus").focus(function() { $("#terminal").addClass('focus'); } ).blur(function() { $("#terminal").removeClass('focus'); } );
    $("#terminalfocus").keypress(function(e) { 
      e.preventDefault();
      var ch = String.fromCharCode(e.which);
      serial_lib.write(ch);
    }).keydown(function(e) { 
      var ch = undefined;
      if (e.ctrlKey) {
        if (e.keyCode == 'C'.charCodeAt(0)) ch = String.fromCharCode(3); // control C
      }
      if (e.keyCode == 8) ch = "\x08"; // backspace
      if (e.keyCode == 9) ch = "\x09"; // tab
      if (e.keyCode == 46) ch = String.fromCharCode(27)+String.fromCharCode(91)+String.fromCharCode(51)+String.fromCharCode(126); // delete
      if (e.keyCode == 38) ch = String.fromCharCode(27)+String.fromCharCode(91)+String.fromCharCode(65); // up
      if (e.keyCode == 40) ch = String.fromCharCode(27)+String.fromCharCode(91)+String.fromCharCode(66); // down
      if (e.keyCode == 39) ch = String.fromCharCode(27)+String.fromCharCode(91)+String.fromCharCode(67); // right
      if (e.keyCode == 37) ch = String.fromCharCode(27)+String.fromCharCode(91)+String.fromCharCode(68); // left
      if (e.keyCode == 36) ch = String.fromCharCode(27)+String.fromCharCode(79)+String.fromCharCode(72); // home
      if (e.keyCode == 35) ch = String.fromCharCode(27)+String.fromCharCode(79)+String.fromCharCode(70); // end
      if (e.keyCode == 33) ch = String.fromCharCode(27)+String.fromCharCode(91)+String.fromCharCode(53)+String.fromCharCode(126); // page up
      if (e.keyCode == 34) ch = String.fromCharCode(27)+String.fromCharCode(91)+String.fromCharCode(54)+String.fromCharCode(126); // page down

      if (ch!=undefined) {
        e.preventDefault();
        serial_lib.write(ch);
      } 
    }).bind('paste', function () {
      var element = this; 
      // nasty hack - wait for paste to complete, then get contents of input
      setTimeout(function () {
        var text = $(element).val();
        $(element).val("");        
        serial_lib.write(text);
      }, 100);
    });

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
    
    serial_lib.getPorts(function(items) {
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
    serial_lib.open(serialPort, function(cInfo) {
      if (cInfo!=undefined) {
        logSuccess("Device found (connectionId="+cInfo.connectionId+")");
        flipState(false);
        Espruino.Status.setStatus("Connected");
        serial_lib.startListening(onRead);
      } else {
        // fail
        flipState(true);
        Espruino.Status.setStatus("Connect Failed.");
      }
    }, function () {
      console.log("Force disconnect");
      closeSerial(); // force disconnect
    });
  };

  var closeSerial=function() {
   serial_lib.close(function(result) {
     flipState(true);
     Espruino.Status.setStatus("Disconnected");
    });
  };
    
  
  function getSubString(str, from, len) {
    if (len == undefined) {
      return str.substr(from, len);
    } else {
      var s = str.substr(from, len);
      while (s.length < len) s+=" ";
      return s;
    }
  }
  
  var handleReceivedCharacter = function (/*char*/ch) {
        //console.log("IN = "+ch);
        if (termControlChars.length==0) {        
          switch (ch) {
            case  8 : {
              if (termCursorX>0) termCursorX--;
            } break;
            case 10 : {
              termCursorX = 0; termCursorY++;
              while (termCursorY >= termText.length) termText.push("");
            } break;
            case 13 : {
              termCursorX = 0;           
            } break;
            case 27 : {
              termControlChars = [ 27 ];
            } break;
            default : {
              termText[termCursorY] = getSubString(termText[termCursorY],0,termCursorX) + String.fromCharCode(ch) + getSubString(termText[termCursorY],termCursorX+1);
              termCursorX++;
            }
          }
       } else if (termControlChars[0]==27) {
         if (termControlChars[1]==91) {
           switch (ch) {
             case 65: if (termCursorY > 0) termCursorY--; break; break; // up  FIXME should add extra lines in...
             case 66: termCursorY++; while (termCursorY >= termText.length) termText.push(""); break;  // down FIXME should add extra lines in...
             case 67: termCursorX++; break; // right
             case 68: if (termCursorX > 0) termCursorX--; break; // left
           }
           termControlChars = [];      
         } else {
           switch (ch) {
             case 91: {
               termControlChars = [27, 91];      
             } break;
             default: {
               termControlChars = [];      
             }
           }
         }
       } else termControlChars = [];         
  };

  var escapeHTML = (function () {
    var chr = { '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;', ' ': '&nbsp;' };
    return function (text) {
        return text.replace(/[\"&<> ]/g, function (a) { return chr[a]; });
    };
  }());

  var updateTerminal = function() {        
        var t = [];
        for (y in termText) {
          var line = termText[y];
          if (y == termCursorY) {
            var ch = getSubString(line,termCursorX,1);
            line = escapeHTML(getSubString(line,0,termCursorX)) + "<span class='termCursor'>" + escapeHTML(ch) + "</span>" + escapeHTML(getSubString(line,termCursorX+1));
          } else
            line = escapeHTML(line);
          t.push("<div class='termLine' lineNumber='"+y+"'>"+line+"</div>");
        }
        
        $("#terminal").html(t.join(""));
        var cursorLine = $("#terminal .termLine[lineNumber="+termCursorY+"]");
        cursorLine[0].scrollIntoView();
/*        var lineHeight = cursorLine.height();
        var cursorPos = cursorLine.position().top;
        var scrollHeight = $("#terminal").innerHeight();
        var scrollPos = $("#terminal").scrollTop();
        if (cursorPos+lineHeight > scrollHeight) $("#terminal").scrollTop(lineHeight+cursorPos-scrollHeight);
        if (cursorPos < 0) $("#terminal").scrollTop(cursorPos);*/
  };

  var onRead=function(readData) {
    // Add data to our buffer
    var bufView=new Uint8Array(readData);
    for (var i=0;i<bufView.length;i++) 
      displayData.push(bufView[i]);
    // If we haven't had data after 50ms, update the HTML
    if (displayTimeout == null) 
      displayTimeout = window.setTimeout(function() {
        for (i in displayData) 
          handleReceivedCharacter(displayData[i]);
        updateTerminal();
        displayData = [];
        displayTimeout = null;
      }, 50);
  };

  init();
})();





