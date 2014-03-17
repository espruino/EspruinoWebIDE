/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  CodeMirror JavaScript editor
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  var codeMirror;
  
  function init() {    
    $('<div id="divcode"><textarea id="code" name="code"></textarea></div>').appendTo(".splitter .right");
    // The code editor
    codeMirror = CodeMirror.fromTextArea(document.getElementById("code"), {
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
  }
  
  function eventHandler(eventType) {
  }
  
  function getCode() {
    return codeMirror.getValue();
  }
  
  function setCode(code) {
    codeMirror.setValue(code);
  }
  
  Espruino.Core.EditorJavaScript = {
    init : init,
    eventHandler : eventHandler,
    getCode : getCode,
    setCode : setCode,
  };
}());