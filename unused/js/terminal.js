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

  }

})();





