/**
 Copyright 2015 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Graphical debugger that hooks into Espruino's internal debugger
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  var CSS_BG_CLASS = "cm-DebugLineBg";
  
  var inDebugMode = false;
  var currentDebugLine = undefined;
  var callbackOnEqualsLine = undefined; // fn to call when we get `=xxx` - used for variable tooltips
  var equalsLineContents = ""; // for multiple line '=' data, this is what we have so far
  var knownValues = {};
  var icons = {};
  
  function init() {
    
    Espruino.addProcessor("terminalPrompt", onTerminalPrompt);
    Espruino.addProcessor("terminalNewLine", onTerminalNewLine);
    Espruino.addProcessor("editorHover", onEditorHover);
  }
  
  function debugCmd(cmd) {
    Espruino.Core.Serial.write(cmd+"\n");
  }
  
  function addIcons() {
    icons.go = Espruino.Core.App.addIcon({ 
      id: "debug-go",
      icon: "debug-go", 
      title : "Continue Running", 
      order: 2000, 
      area: {
        name: "code",
        position: "top"
      },
      click: function() { debugCmd("continue"); }
    });
    icons.stop = Espruino.Core.App.addIcon({ 
      id: "debug-stop",
      icon: "debug-stop", 
      title : "Stop Debugging", 
      order: 2001, 
      area: {
        name: "code",
        position: "top"
      },
      click: function() { debugCmd("quit"); }
    });
    icons.into = Espruino.Core.App.addIcon({ 
      id: "debug-into",
      icon: "debug-into", 
      title : "Step Into Statement", 
      order: 2002, 
      area: {
        name: "code",
        position: "top"
      },
      click: function() { debugCmd("step"); }
    });  
    icons.over = Espruino.Core.App.addIcon({ 
      id: "debug-over",
      icon: "debug-over", 
      title : "Step Over (Next Statement)", 
      order: 2003, 
      area: {
        name: "code",
        position: "top"
      },
      click: function() { debugCmd("next"); }
    });     
    icons.out = Espruino.Core.App.addIcon({ 
      id: "debug-out",
      icon: "debug-out", 
      title : "Step Out (finish)", 
      order: 2004, 
      area: {
        name: "code",
        position: "top"
      },
      click: function() { debugCmd("finish"); }
    });       
  }
  
  function removeIcons() {
    for (var i in icons) {
      if (icons[i]!==undefined) {
        icons[i].remove();
        icons[i] = undefined;
      }
    }
  }
  
  function setDebugMode(isDbg) {
    if (inDebugMode != isDbg) {
      inDebugMode = isDbg;
      knownValues = {};
      if (inDebugMode) {
        addIcons();
      } else {
        removeIcons();
        setDebugLine(undefined); // remove any marked lines
      }
      Espruino.callProcessor("debugMode", inDebugMode);
    }
  }
  
  function setDebugLine(line) {
    var cm = Espruino.Core.EditorJavaScript.getCodeMirror();
    if (currentDebugLine!==undefined) {
      knownValues = {};
      cm.removeLineClass(currentDebugLine, "background", CSS_BG_CLASS);
    }
    if (line!==undefined) {
      cm.addLineClass(line, "background", CSS_BG_CLASS);
    }
    currentDebugLine = line;
  }    
  
  function onEditorHover(info, callback) {
    function setTooltip(value) {
      knownValues[name] = value;
      var tip = document.createElement("div");
      tip.className = "CodeMirror-debug-tooltip";
      tip.appendChild(document.createTextNode(name + " = " + value));      
      info.showTooltip(tip);
    };

    if (inDebugMode && // in debug mode
        !callbackOnEqualsLine && // we're not trying to do something already
        Espruino.Core.Terminal.getTerminalLine()=="debug>" // user is not currently typing on LHS
        ) {
      var name;
      if (info.node.className=="cm-variable" ||
          info.node.className=="cm-variable-2" ||
          info.node.className=="cm-def") {
        name = info.node.textContent;
      }
      if (info.node.className=="cm-property") {
        // get 'a.b' type stuff. There must be a better way :)
        if (info.node.previousSibling &&
            info.node.previousSibling.textContent=="." &&
            info.node.previousSibling.previousSibling &&
            info.node.previousSibling.previousSibling.className == "cm-variable") {
          name = info.node.previousSibling.previousSibling.textContent + "." + info.node.textContent;
        }
      }
      if (name) { 
        if (name in knownValues) {
          setTooltip(knownValues[name]);
        } else {
          equalsLineContents = undefined;
          callbackOnEqualsLine = setTooltip;
          debugCmd("p "+name);
        }
      }
    }
    callback(info);
  }
  
  function onTerminalPrompt(prompt, callback) {
    if (prompt == "debug>") {
      setDebugMode(true);
      var lastLine = Espruino.Core.Terminal.getTerminalLine(1);
      if (lastLine && lastLine.indexOf("^")>0) {
        var codeLine = Espruino.Core.Terminal.getTerminalLine(2);
        if (codeLine) {
          var lineNumber = parseInt(codeLine.substr(0,8).trim());
          if (lineNumber) setDebugLine(lineNumber-1);
        }
      }
    } else {
      setDebugMode(false);      
    }
    
    callback(prompt);
  }
  
  function onTerminalNewLine(lastLine, callback) {
    if (inDebugMode) {
      if (callbackOnEqualsLine) {
        /** We might want to get the value of some expression in the debugger,
         * so we write `p myExpr\n` to Espruino, and wait for a result, which
         * should be `=foo`. Of course it might be multi-line */  
        if (lastLine) {
          if (lastLine[0]=="=" && callbackOnEqualsLine) {
            equalsLineContents=lastLine.substr(1);
            if (Espruino.Core.Utils.countBrackets(equalsLineContents)<=0) {
              callbackOnEqualsLine(equalsLineContents);
              equalsLineContents = undefined;
              callbackOnEqualsLine = undefined;
            }
          } else if (equalsLineContents!==undefined && callbackOnEqualsLine) {
            equalsLineContents += lastLine;
            if (Espruino.Core.Utils.countBrackets(equalsLineContents)<=0) {
              callbackOnEqualsLine(equalsLineContents);
              equalsLineContents = undefined;
              callbackOnEqualsLine = undefined;
            }
          } else if (lastLine.substr(0,6)!="debug>") {
            // we had some error and couldn't dump the value
            equalsLineContents = undefined;
            callbackOnEqualsLine = undefined;
          }
        }
      } else {
        // we're not sure what's going on (an unexpected print, or an exception)
        // but let's keep the highlighted line anyway
        // setDebugLine(undefined); // remove highlighted line
      }
    }
    callback(lastLine);
  }
  
  Espruino.Plugins.Debugger = {
    init : init,
  };
}());
