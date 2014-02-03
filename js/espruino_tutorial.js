/*
 * The MIT License

Copyright (c) 2013 by Gordon Williams

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
   // Tutorials
   Espruino["Tutorial"] = {};

   var tutorialDir = "data/tutorials/";

   var tutorialData = [];
   var tutorialStep = 0;
   var tutorialLastInputLine = undefined;
   var tutorialWatcherInterval = undefined;
    
   Espruino.Tutorial.init = function() {
   }

   Espruino.Tutorial.initOptions = function() {
     Espruino.Options.optionBlocks.push({id:"#divOptionTutorial",htmlUrl:"data/Espruino_Tutorial.html", onForm:function() {
       // load tutorial list
       $.getJSON(tutorialDir+"index.json", function (data) {
         $("#tutorialList").find('option').remove();
         for (var i in data) {
           $("#tutorialList").append('<option value="'+data[i].filename+'">'+data[i].name+'</option>');
         }
       });
       // Set up tutorial button
       $( "#startTutorial" ).button({ label : tutorialWatcherInterval ? "Stop" : "Start"  } ).click(function() {        
         var btn = $("#startTutorial");
         if (btn.text()!="Stop") {
           loadTutorialURL(tutorialDir+$("#tutorialList").val());
           btn.button({label:"Stop"});
         } else {
           stopTutorial();
           btn.button({label:"Start"});
         }
       });
     }});
    };



    
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

    function stopTutorial() {
      tutorialData = [];
      tutorialStep = 0;
      tutorialLastInputLine = undefined;
      if (tutorialWatcherInterval) clearInterval(tutorialWatcherInterval);
      tutorialWatcherInterval = undefined;
      Espruino.Terminal.clearExtraText();
     }
    
    function displayTutorialStep() {
      var inputLine = Espruino.Terminal.getInputLine(0);
      var text = '<div class="tutorial_text">'+Espruino.General.markdownToHTML(tutorialData[tutorialStep].text)+'<br/>';
      if (tutorialData[tutorialStep].code != "")
        text += '<div class="tutorial_code">'+Espruino.General.escapeHTML(tutorialData[tutorialStep].code).replace(/\n/g,"<br/>")+'</div>';
      text += '</div>';
      Espruino.Terminal.setExtraText((inputLine===undefined)?0:inputLine.line, text);      
    }
    
    function getLexer(str) {
      // Nasty lexer - no comments/etc
      var chAlpha="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
      var chNum="0123456789";
      var chAlphaNum = chAlpha+chNum;
      var chWhiteSpace=" \t\n\r";
      var ch = str[0];
      var idx = 1;
      var nextCh = function() { ch = str[idx++]; };
      var isIn = function(s,c) { return s.indexOf(c)>=0; } ;
      var nextToken = function() {
        while (isIn(chWhiteSpace,ch)) nextCh();
        if (ch==undefined) return undefined; 
        var s = "";        
        if (isIn(chAlpha,ch)) {
          do {
            s+=ch;
            nextCh();
          } while (isIn(chAlphaNum,ch));
        } else if (isIn(chNum,ch)) {
          do {
            s+=ch;
            nextCh();
          } while (isIn(chNum,ch))
        } else if (isIn("\"'",ch)) {
          var q = ch;
          s+=ch;
          nextCh();
          while (ch!=q) {
            s+=ch;
            nextCh();
          };
        } else {
          s+=ch;
          nextCh();
        }
        return s;
      };
      
      return {
        next : nextToken
      };
    }
       
    function isCodeEqual(a,b) {
      console.log("Compare");
      console.log("A> "+JSON.stringify(a));
      console.log("B> "+JSON.stringify(b));
      // now compare streams of tokens
      var la = getLexer(a);
      var tka = la.next();
      var lb = getLexer(b);
      var tkb = lb.next();
      while (tka!==undefined && tkb!=undefined) {
        if (tka!=tkb) return false;
        tka = la.next();
        tkb = lb.next();
      }
      return true;
    }
    
    function tutorialWatcher() {
      if (tutorialStep >= tutorialData.length) return;
      
      // Find out if we've accidentally skipped some input lines
      var linesPast = 0;
      var line = Espruino.Terminal.getInputLine(linesPast);      
      if (line===undefined) return;
      var currentInputLine = line.line;
      if (tutorialLastInputLine===undefined) tutorialLastInputLine = line.line;
      while (line!==undefined && line.line>tutorialLastInputLine) {
        linesPast++;
        line = Espruino.Terminal.getInputLine(linesPast);
      }
      tutorialLastInputLine = currentInputLine;
      // if we have, try and handle them
      while (linesPast>0) {
        console.log("Checking previous line "+linesPast);
        line = Espruino.Terminal.getInputLine(linesPast);
        // user has entered the correct command - let's move to next
        if (isCodeEqual(line.text,tutorialData[tutorialStep].code) && 
            tutorialStep+1 < tutorialData.length) {          
          tutorialStep++;
          displayTutorialStep();
        }
        linesPast--;
      }
     /* 
      if (line!==undefined) {
        var ok = line.text == tutorialData[tutorialStep].code;        
        Espruino.Terminal.setHintText(ok?"Right":"Wrong");
      }*/
    }
    
    Espruino.Tutorial.getTutorialData = function() {
       return tutorialData;
    };
   
})();
