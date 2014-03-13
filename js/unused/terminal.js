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
"use strict";
(function() {

  /* Handle newline conversions - Windows expects newlines as /r/n
     when we're saving/loading files */
  var convertFromOS = function (chars) {
    if (!Espruino.Core.Utils.isWindows()) return chars;
    return chars.replace(/\r\n/g,"\n");
  };
  var convertToOS = function (chars) {
    if (!Espruino.Core.Utils.isWindows()) return chars;
    return chars.replace(/\r\n/g,"\n").replace(/\n/g,"\r\n");
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
        Espruino.Status.setError("Problem initialising WebCam");
      });
    } 
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
  

  
    
  function init() {


    // The code editor
    Espruino.codeEditor = CodeMirror.fromTextArea(document.getElementById("code"), {
      lineNumbers: true,matchBrackets: true,mode: "text/typescript",
      lineWrapping: true,
      showTrailingSpace: true,
      lint: {
        es5         : true, // if ES5 syntax should be allowed
        evil        :true // don't warn on use of strings in setInterval
      },
      highlightSelectionMatches: {showToken: /\w/},
      foldGutter: {rangeFinder: new CodeMirror.fold.combine(CodeMirror.fold.brace, CodeMirror.fold.comment)},
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
      extraKeys: {
        "Ctrl-Space": "autocomplete",
        Tab: function(cm) { 
          if (cm.somethingSelected()) {
            cm.indentSelection("add");
          } else { // make sure the tab key indents with spaces
            cm.replaceSelection(cm.getOption("indentWithTabs")? "\t":
              Array(cm.getOption("indentUnit") + 1).join(" "), "end", "+input");
          }
        }
      }
    });

    // terminal toolbar
    $( ".webcam" ).button({ text: false, icons: { primary: "ui-icon-person" } }).click(toggleWebCam);
    // code toolbar
    
    $( ".blockly" ).button({ text: false, icons: { primary: "ui-icon-image" } }).click(function() {
        if (isInBlockly()) {
          $("#divblockly").hide();
          $("#divcode").show();
        } else {
          $("#divcode").hide();
          $("#divblockly").show();
        }

    });


    $( ".load" ).button( { text: false, icons: { primary: "ui-icon-folder-open" } } ).click( function () {
      $( "#fileLoader" ).click();
    } );
    $( ".reload" ).button( { text: false, icons: { primary: "ui-icon-refresh" } } ).click( function () {
      $('#fileLoader').change();
    } );
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

    
    // get code from our config area at bootup
    Espruino.Config.get("code", function (savedCode) {
      if (savedCode) {
        Espruino.codeEditor.setValue(savedCode);
        console.log("Loaded code from storage.");
      } else {
        Espruino.codeEditor.setValue("var  l = false;\nsetInterval(function() {\n  l = !l;\n  LED1.write(l);\n}, 500);");
        console.log("No code in storage.");
      }
    });
  }

})();





