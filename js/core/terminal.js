/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  VT100 terminal window
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  var onInputData = function(d){}; // the handler for character data from user 

  var displayTimeout = null;
  var displayData = [];
  
  // Text to be displayed in the terminal
  var termText = [ "" ];
  // Map of terminal line number to text to display before it
  var termExtraText = {}; 
  
  var termCursorX = 0;
  var termCursorY = 0;
  var termControlChars = [];    

  // maximum lines on the terminal
  var MAX_LINES = 2048;
  
  function init() 
  {
    // Add buttons
    Espruino.Core.App.addIcon({ 
      id: "clearScreen",
      icon: "clear", 
      title : "Clear Screen", 
      order: -100, 
      area: {
        name: "terminal",
        position: "top"
      },
      click: function(){
        clearTerminal();
        focus();
      }
    });

    // Add stuff we need
    $('<div id="terminal" class="terminal"></div>').appendTo(".editor--terminal .editor__canvas");
    $('<textarea id="terminalfocus" class="terminal__focus" rows="1" cols="1"></textarea>').appendTo(document.body);

    // Populate terminal
    $.get("data/terminal_initial.html", function (data){
      $("#terminal").html(data);  
      $(".tour_link").click(function(e) { 
        e.preventDefault(); 
        $("#icon-tour").click(); 
      });
    });
    
    $("#terminal").mouseup(function() {
      var terminalfocus = $('#terminalfocus');
      var selection = window.getSelection();
      /* this rather convoluted code checks to see if the selection
       * is actually part of the terminal. It may be that the user
       * clicked on the editor pane, dragged, and released over the
       * terminal in which case we DON'T want to copy. */ 
      if (selection.rangeCount > 0) {
        var node = selection.getRangeAt(0).startContainer;
        var terminal = $("#terminal")[0];
        while (node && node!=terminal)
          node = node.parentNode;
        
        if (node==terminal) {
          // selection WAS part of terminal  
          var selectedText = selection.toString();
          if (selectedText.trim().length > 0) {               
            //console.log(selectedText);
            //console.log(selectedText.split("").map(function(c) { return c.charCodeAt(0); }));    
            selectedText = selectedText.replace(/\xA0/g," "); // Convert nbsp chars to spaces
            //console.log(selectedText.split("").map(function(c) { return c.charCodeAt(0); }));
            terminalfocus.val(selectedText).select();
            document.execCommand('copy');
            terminalfocus.val('');
          }
        }
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
    
    
    Espruino.addProcessor("connected", function(data, callback) {
      grabSerialPort();
      outputDataHandler("\r\nConnected\r\n>");
      $("#terminal").addClass("terminal--connected");
      callback(data);
    });
    Espruino.addProcessor("disconnected", function(data, callback) {
      outputDataHandler("\r\nDisconnected\r\n>");
      $("#terminal").removeClass("terminal--connected");
      callback(data);
    });
  };
  
  var clearTerminal = function() {
    // Get just the last entered line
    var currentLine = Espruino.Core.Terminal.getInputLine();
    if (currentLine==undefined)
      currentLine = { text : "" };
    termText = currentLine.text.split("\n");
    // re-add > and : marks
    for (var l in termText)
      termText[l] = (l==0?">":":") + termText[l]; 
    // reset other stuff...
    termExtraText = {}; 
    // leave X cursor where it was...
    termCursorY -= currentLine.line; // move Y cursor back
    termControlChars = [];   
    // finally update the HTML
    updateTerminal();
    // fire off a clear terminal processor
    Espruino.callProcessor("terminalClear");
  };

  var updateTerminal = function() {  
    var terminal = $("#terminal");
    // gather a list of elements for each line
    var elements = [];
    terminal.children().each(function() {
      var n = $(this).attr("lineNumber");
      if (n!==undefined)
        elements[n] = $(this);
      else
        $(this).remove(); // remove stuff that doesn't have a line number
    });
    
    // remove extra lines if there are too many
    if (termText.length > MAX_LINES) {
      var removedLines = termText.length - MAX_LINES;
      termText = termText.slice(removedLines);
      termCursorY -= removedLines;
      var newTermExtraText = {};
      for (var i in termExtraText) {
        if (i>=removedLines) 
          newTermExtraText[i-removedLines] = termExtraText[i];
      }
      termExtraText = newTermExtraText;
      
      // now renumber our elements (cycle them around)
      var newElements = [];
      for (i in elements) {
        var n = elements[i].attr("lineNumber") - removedLines;
        if (n<0) { // if it's fallen off the bottom, delete it
          elements[i].remove();
        } else {
          elements[i].attr("lineNumber", n);
          newElements[n] = elements[i];
        }
      }
      elements = newElements;
    }   
    // remove elements if we have too many...
    for (i=termText.length;i<elements.length;i++)
      if (i in elements) 
        elements[i].remove();
    // now write this to the screen
    var t = [];
    for (var y in termText) {
      var line = termText[y];
      if (y == termCursorY) {
        var ch = Espruino.Core.Utils.getSubString(line,termCursorX,1);
        line = Espruino.Core.Utils.escapeHTML(
            Espruino.Core.Utils.getSubString(line,0,termCursorX)) + 
            "<span class='terminal__cursor'>" + Espruino.Core.Utils.escapeHTML(ch) + "</span>" + 
            Espruino.Core.Utils.escapeHTML(Espruino.Core.Utils.getSubString(line,termCursorX+1));
      } else
        line = Espruino.Core.Utils.escapeHTML(line);
      // extra text is for stuff like tutorials
      if (termExtraText[y])
        line = termExtraText[y] + line;
      
      // Only update the elements if they need updating
      if (elements[y]===undefined) {
        var prev = y-1;
        while (prev>=0 && elements[prev]===undefined) prev--;
        elements[y] = $("<div class='termLine' lineNumber='"+y+"'>"+line+"</div>");
        if (prev<0) elements[y].appendTo(terminal);
        else elements[y].insertAfter(elements[prev]);
      } else if (elements[y].html()!=line)
        elements[y].html(line);
    }
    // now show the line where the cursor is
    if (elements[termCursorY]!==undefined);
      elements[termCursorY][0].scrollIntoView();
  };

  function trimRight(str) {
    var s = str.length-1;
    while (s>0 && str[s]==" ") s--;
    return str.substr(0,s+1);      
  }
  
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
          // Else actually add character
          termText[termCursorY] = trimRight(
              Espruino.Core.Utils.getSubString(termText[termCursorY],0,termCursorX) + 
              String.fromCharCode(ch) + 
              Espruino.Core.Utils.getSubString(termText[termCursorY],termCursorX+1));
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
  
  /// Set the callback(String) that gets called when the user presses a key. Returns the old one
  function setInputDataHandler( callback ) {
    var old = onInputData; 
    onInputData = callback;
    return old;
  };
  
  /// Called when data comes OUT of Espruino INTO the terminal
  function outputDataHandler(readData) {
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
  function grabSerialPort() {
    // Ensure that keypresses go direct to the Espruino device
    Espruino.Core.Terminal.setInputDataHandler(function(d) {
      Espruino.Core.Serial.write(d);
    });
    // Ensure that data from Espruino goes to this terminal
    Espruino.Core.Serial.startListening(Espruino.Core.Terminal.outputDataHandler);      
  };

  /// Get the current terminal line that we're on
  function getCurrentLine() {
    return termText.length-1;
  };
  
  /// Set extra text to display before a certain terminal line
  function setExtraText(line, text) {
    if (termExtraText[line] != text) {
      termExtraText[line] = text;
      updateTerminal();
    }      
  };    

  /// Clear all extra text that is to be displayed
  function clearExtraText() {
    termExtraText = {};
    updateTerminal();
  };   

  /// Give the terminal focus
  function focus() {
    $("#terminalfocus").focus(); 
  };
  
  /// Get the Nth from latest terminal line (and the line number of it). 0=current line
  function getInputLine(n) {
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


  Espruino.Core.Terminal = {
      init : init,
      
      getInputLine : getInputLine,
      getCurrentLine : getCurrentLine,
      focus : focus, // Give this focus
      
      setExtraText : setExtraText,
      clearExtraText : clearExtraText,
      
      grabSerialPort : grabSerialPort,
      setInputDataHandler : setInputDataHandler,
      outputDataHandler : outputDataHandler,      
  };

})();
