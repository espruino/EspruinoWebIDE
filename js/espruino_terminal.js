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
    // Code to handle display and input from the left-hand terminal pane
    Espruino["Terminal"] = {};
    Espruino.Terminal.autoSaveCode = true;
    
    var onInputData = function(d){}; // the handler for character data from user 

    var displayTimeout = null;
    var displayData = [];
    
    // Text to be displayed in the terminal
    var termText = [ "" ];
    // Map of terminal line number to text to display before it
    var termExtraText = {}; 
    /// Extra text that is displayed right at the end of the terminal
    var termHintText = undefined;
    
    var termCursorX = 0;
    var termCursorY = 0;
    var termControlChars = [];    
    
    
    Espruino.Terminal.init = function() {
      Espruino.Options.optionFields.push({id:"#autoSaveCode",module:"Terminal",field:"autoSaveCode",type:"check",onBlur:true});      
      Espruino.Options.optionBlocks.push({module:"Terminal",buttonLine:1});
      
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
        onInputData(ch);
      }).keydown(function(e) { 
        var ch = undefined;
        if (e.ctrlKey) {
          if (e.keyCode == 'C'.charCodeAt(0)) ch = String.fromCharCode(3); // control C
        }
        if (e.altKey) {
          console.log(e.keyCode);
          if (e.keyCode == 13) ch = String.fromCharCode(27)+String.fromCharCode(10); // Alt enter
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
          onInputData(ch);
        } 
      }).bind('paste', function () {
        var element = this; 
        // nasty hack - wait for paste to complete, then get contents of input
        setTimeout(function () {
          var text = $(element).val();
          $(element).val("");        
          onInputData(text);
        }, 100);
      });
    };
    
    var updateTerminal = function() {        
      var t = [];
      for (var y in termText) {
        var line = termText[y];
        if (y == termCursorY) {
          var ch = Espruino.General.getSubString(line,termCursorX,1);
          line = Espruino.General.escapeHTML(Espruino.General.getSubString(line,0,termCursorX)) + "<span class='termCursor'>" + Espruino.General.escapeHTML(ch) + "</span>" + Espruino.General.escapeHTML(Espruino.General.getSubString(line,termCursorX+1));
        } else
          line = Espruino.General.escapeHTML(line);
        
        if (termExtraText[y])
          t.push(termExtraText[y]);
        t.push("<div class='termLine' lineNumber='"+y+"'>"+line+"</div>");
      }
      // last line...
      if (termExtraText[termText.length])
        t.push(termExtraText[termText.length]);
      if (termHintText!==undefined)
        t.push(termHintText);
      
      $("#terminal").html(t.join(""));
      var cursorLine = $("#terminal .termLine[lineNumber="+termCursorY+"]");
      cursorLine[0].scrollIntoView();
    };
    
    var handleReceivedCharacter = function (/*char*/ch) {
      //console.log("IN = "+ch);
      if (termControlChars.length==0) {        
        switch (ch) {
          case  8 : {
            if (termCursorX>0) termCursorX--;
          } break;
          case 10 : { // line feed
            termCursorX = 0; termCursorY++;
            while (termCursorY >= termText.length) termText.push("");
          } break;
          case 13 : { // carriage return
            termCursorX = 0;           
          } break;
          case 27 : {
            termControlChars = [ 27 ];
          } break;
          default : {
            // E$lse actually add character
            termText[termCursorY] = Espruino.General.getSubString(termText[termCursorY],0,termCursorX) + String.fromCharCode(ch) + Espruino.General.getSubString(termText[termCursorY],termCursorX+1);
            termCursorX++;
          }
        }
     } else if (termControlChars[0]==27) {
       if (termControlChars[1]==91) {
         if (termControlChars[2]==63) {
           if (termControlChars[3]==55) {
             if (ch!=108)
               console.log("Expected 27, 91, 63, 55, 108 - no line overflow sequence");
             termControlChars = [];
           } else {
             if (ch==55) {
               termControlChars = [27, 91, 63, 55];
             } else termControlChars = [];
           }
         } else {
           termControlChars = [];
           switch (ch) {
             case 63: termControlChars = [27, 91, 63]; break;
             case 65: if (termCursorY > 0) termCursorY--; break; // up  FIXME should add extra lines in...
             case 66: termCursorY++; while (termCursorY >= termText.length) termText.push(""); break;  // down FIXME should add extra lines in...
             case 67: termCursorX++; break; // right
             case 68: if (termCursorX > 0) termCursorX--; break; // left
           }           
         }
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
    
  
// ----------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------
    
    /// Set the callback(String) that gets called when the user presses a key
    Espruino.Terminal.setInputDataHandler = function( callback ) {
      onInputData = callback;
    };
    
    /// Called when data comes OUT of Espruino INTO the terminal
    Espruino.Terminal.outputDataHandler = function(readData) {
      if ("string" == typeof readData)
        readData = readData.split("").map(function(x) {return x.charCodeAt();});
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
    
    /// Claim input and output of the Serial port
    Espruino.Terminal.grabSerialPort = function() {
      // Ensure that keypresses go direct to the Espruino device
      Espruino.Terminal.setInputDataHandler(function(d) {
        Espruino.Serial.write(d);
      });
      // Ensure that data from Espruino goes to this terminal
      Espruino.Serial.startListening(Espruino.Terminal.outputDataHandler);      
    };

    /// Get the current terminal line that we're on
    Espruino.Terminal.getCurrentLine = function() {
      return termText.length-1;
    };
    
    /// Set extra text to display before a certain terminal line
    Espruino.Terminal.setExtraText = function(line, text) {
      if (termExtraText[line] != text) {
        termExtraText[line] = text;
        updateTerminal();
      }      
    };    

    /// Clear all extra text that is to be displayed
    Espruino.Terminal.clearExtraText = function() {
      termExtraText = {};
      updateTerminal();
    };   
    
    /// Set the hint text that appears after the final line
    Espruino.Terminal.setHintText = function(text) {
      if (termHintText != text) {
        termHintText = text;
        updateTerminal();
      }      
    };

    /// Give the terminal focus
    Espruino.Terminal.focus = function() {
        $("#terminalfocus").focus(); 
    };
    
    /// Get the Nth from latest terminal line (and the line number of it)
    Espruino.Terminal.getInputLine = function(n) {
      if (n===undefined) n=0;
      var startLine = termText.length-1;
      while (startLine>=0 && !(n==0 && termText[startLine].substr(0,1)==">")) {
        if (termText[startLine].substr(0,1)==">") n--;
        startLine--;
      }
      if (startLine<0) return undefined;
      var line = startLine;
      var text = termText[line++].substr(1);
      while (line < termText.length && termText[line].substr(0,1)==":")
        text += "\n"+termText[line++].substr(1);
      return { line : startLine, text : text };
    };

})();
