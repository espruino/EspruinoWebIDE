/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  The Espruino tutorial
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  var TUTORIALS_DIR = "/data/tutorials/";  
  
  var tutorialData = [];
  var tutorialStep = 0;
  var tutorialLastInputLine = undefined;
  var tutorialWatcherInterval = undefined;  
  
  function init() {
    Espruino.Core.App.addIcon({ 
      id: "help",
      icon: "help", 
      title : "Help", 
      order: -95, 
      area: { 
        name: "toolbar", 
        position: "right" 
      },
      menu: [{
        id: "tutorial",
        icon: "help",
        title: "Tutorial",
        order: 100,
        click: function(){
          if (!hasTutorial()) {
            Espruino.Core.MenuPortSelector.ensureConnected(function() {
              loadTutorialURL(TUTORIALS_DIR+"1.js");        
            });
          } else {
            stopTutorial(); 
          }
        }
      }]
    });

    // if terminal was cleared this may have been to remove the tutorial, so do this if needed
    Espruino.addProcessor("terminalClear", function(data, callback) {      
      if (hasTutorial()) 
        stopTutorial();
      callback(data);
    });
    // If disconnect, stop tutorial too
    Espruino.addProcessor("disconnected", function(data, callback) {      
      if (hasTutorial()) 
        stopTutorial();
      callback(data);
    });
  }
  
  function loadTutorialText(text) {
    var step = { text : "", code : "" };
    tutorialData = [ ];
    var lines = text.split("\n");
    for (var i in lines) {
      var l = lines[i];
      if (l.substr(0,2)=="//") {
        step.text += l.substr(2).trim()+"\n";
      } else
        step.code += l+"\n";
      if (l=="" && step.text!="") {
        step.code = step.code.trim();
        step.text = step.text.trim();
        tutorialData.push(step);
        step = { text : "", code : "" };          
      }
    }      
    if (step.text!="") 
      tutorialData.push(step);
    // test
    displayTutorialStep();
  }
  
  function loadTutorialURL(url) {
    $.get( url, function(data) {
      loadTutorialText(data);
      if (tutorialWatcherInterval===undefined)
        tutorialWatcherInterval = setInterval(tutorialWatcher, 1000);
    });
  }

  function hasTutorial() {
    return tutorialData.length != 0;
  }
  
  function stopTutorial() {
    tutorialData = [];
    tutorialStep = 0;
    tutorialLastInputLine = undefined;
    if (tutorialWatcherInterval) clearInterval(tutorialWatcherInterval);
    tutorialWatcherInterval = undefined;
    Espruino.Core.Terminal.clearExtraText();
   }
  
  function displayTutorialStep() {
    var inputLine = Espruino.Core.Terminal.getInputLine(0);
    var text = '<div class="tutorial_text">'+Espruino.Core.Utils.markdownToHTML(tutorialData[tutorialStep].text)+'<br/>';
    if (tutorialData[tutorialStep].code != "")
      text += '<div class="tutorial_code">'+Espruino.Core.Utils.escapeHTML(tutorialData[tutorialStep].code).replace(/\n/g,"<br/>")+'</div>';
    text += '</div>';
    Espruino.Core.Terminal.setExtraText((inputLine===undefined)?0:inputLine.line, text);      
  }
  
  function isCodeEqual(a,b) {
    console.log("Compare");
    console.log("A> "+JSON.stringify(a));
    console.log("B> "+JSON.stringify(b));
    // now compare streams of tokens
    var la = Espruino.Core.Utils.getLexer(a);
    var tka = la.next();
    var lb = Espruino.Core.Utils.getLexer(b);
    var tkb = lb.next();
    while (tka!==undefined || tkb!==undefined) {
      if (tka==undefined || tkb==undefined || tka.str!=tkb.str) {
        return false;
      }
      tka = la.next();
      tkb = lb.next();
    }
    return true;
  }
  
  function tutorialWatcher() {
    if (tutorialStep >= tutorialData.length) return;
    
    // Find out if we've accidentally skipped some input lines
    var linesPast = 0;
    var line = Espruino.Core.Terminal.getInputLine(linesPast);      
    if (line===undefined) return;
    var currentInputLine = line.line;
    if (tutorialLastInputLine===undefined) tutorialLastInputLine = line.line;
    while (line!==undefined && line.line>tutorialLastInputLine) {
      linesPast++;
      line = Espruino.Core.Terminal.getInputLine(linesPast);
    }
    tutorialLastInputLine = currentInputLine;
    // if we have, try and handle them
    while (linesPast>0) {
      console.log("Checking previous line "+linesPast);
      line = Espruino.Core.Terminal.getInputLine(linesPast);
      // user has entered the correct command - let's move to next
      if (line!==undefined && isCodeEqual(line.text,tutorialData[tutorialStep].code) && 
          tutorialStep+1 < tutorialData.length) {          
        tutorialStep++;
        displayTutorialStep();
      }
      linesPast--;
    }
  }
  
  Espruino.Plugins.Tutorial = {
    init : init,
  };
}());
