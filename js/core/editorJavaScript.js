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
  var codeMirrorDirty = false;
  
  function init() {    
    $('<div id="divcode" style="width:100%;height:100%;"><textarea id="code" name="code"></textarea></div>').appendTo(".editor--code .editor__canvas");
    // The code editor
    codeMirror = CodeMirror.fromTextArea(document.getElementById("code"), {
      width: "100%",
      height: "100%",
      lineNumbers: true,
      matchBrackets: true,
      mode: {name: "javascript", globalVars: false},
      lineWrapping: true,
      showTrailingSpace: true,
      lint: {
        es5         : true, // if ES5 syntax should be allowed
        evil        : true, // don't warn on use of strings in setInterval
        laxbreak    : true  // don't warn about newlines in expressions
      },
      highlightSelectionMatches: {showToken: /\w/},
      foldGutter: {rangeFinder: new CodeMirror.fold.combine(CodeMirror.fold.brace, CodeMirror.fold.comment)},
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
      extraKeys: {
        "Tab" : function(cm) { 
          if (cm.somethingSelected()) {
            cm.indentSelection("add");
          } else { // make sure the tab key indents with spaces
            cm.replaceSelection(cm.getOption("indentWithTabs")? "\t":
              Array(cm.getOption("indentUnit") + 1).join(" "), "end", "+input");
          }
        }
      }
    });


  function getURL(url, c) {
    var xhr = new XMLHttpRequest();
    xhr.open("get", url, true);
    xhr.send();
    xhr.onreadystatechange = function() {
      if (xhr.readyState != 4) return;
      if (xhr.status < 400) return c(null, xhr.responseText);
      var e = new Error(xhr.responseText || "No response");
      e.status = xhr.status;
      c(e);
    };
  }

  var server;
  getURL(/*"http://ternjs.net/defs/ecma5.json"*/"/data/espruino.json", function(err, code) {
    if (err) throw new Error("Request for ecma5.json: " + err);
    server = new CodeMirror.TernServer({defs: [JSON.parse(code)], completionTip : function(c) {
      return c.doc;
    }});
    codeMirror.setOption("extraKeys", {
      "Ctrl-Space": function(cm) { server.complete(cm); }, 
      "Ctrl-I": function(cm) { server.showType(cm); },
      "Alt-.": function(cm) { server.jumpToDef(cm); },
      "Alt-,": function(cm) { server.jumpBack(cm); },
      "Ctrl-Q": function(cm) { server.rename(cm); },
      "Ctrl-.": function(cm) { server.selectName(cm); }
    })
    codeMirror.on("cursorActivity", function(cm) { server.updateArgHints(cm); });
  });
  }

  function getCode() {
    return codeMirror.getValue();
  }
  
  function setCode(code) {
    codeMirror.setValue(code);    
    codeMirrorDirty = true;
  }

  /** Called this when we switch modes from blockly - the editor needs a prod to update if the code
   * was set when it was invisible */
  function madeVisible() {
    if (codeMirrorDirty) {
      codeMirrorDirty = false;
      // important we do it a bit later so things have had time to lay out
      setTimeout(function () {
        codeMirror.refresh();
      }, 1);
    }
  }
  
  Espruino.Core.EditorJavaScript = {
    init : init,
    getCode : getCode,
    setCode : setCode,
    madeVisible : madeVisible,
  };
}());
