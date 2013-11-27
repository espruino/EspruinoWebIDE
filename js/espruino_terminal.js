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
(function(){
    // Code to handle display and input from the left-hand terminal pane
    Espruino["Terminal"] = {};
    
    var onInputData = undefined; // the handler for character data from user 

    var displayTimeout = null;
    var displayData = [];
    
    var termText = [ "" ];
    var termCursorX = 0;
    var termCursorY = 0;
    var termControlChars = [];    
    
    
    Espruino.Terminal.init = function() {
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
        Espruino.Serial.write(ch);
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
          Espruino.Serial.write(ch);
        } 
      }).bind('paste', function () {
        var element = this; 
        // nasty hack - wait for paste to complete, then get contents of input
        setTimeout(function () {
          var text = $(element).val();
          $(element).val("");        
          Espruino.Serial.write(text);
        }, 100);
      });
    };
    
    var updateTerminal = function() {        
      var t = [];
      for (y in termText) {
        var line = termText[y];
        if (y == termCursorY) {
          var ch = Espruino.General.getSubString(line,termCursorX,1);
          line = Espruino.General.escapeHTML(Espruino.General.getSubString(line,0,termCursorX)) + "<span class='termCursor'>" + Espruino.General.escapeHTML(ch) + "</span>" + Espruino.General.escapeHTML(Espruino.General.getSubString(line,termCursorX+1));
        } else
          line = Espruino.General.escapeHTML(line);
        t.push("<div class='termLine' lineNumber='"+y+"'>"+line+"</div>");
      }
      
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
            termText[termCursorY] = Espruino.General.getSubString(termText[termCursorY],0,termCursorX) + String.fromCharCode(ch) + Espruino.General.getSubString(termText[termCursorY],termCursorX+1);
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
    
  
// ----------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------
    
    /// Set the callback(String) that gets called when the user presses a key
    Espruino.Terminal.setInputDataHandler = function( callback ) {
      onInputData = callback;
    };
    
    /// Called when data comes OUT of Espruino INTO the terminal
    Espruino.Terminal.outputDataHandler = function(readData) {
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

    

})();
