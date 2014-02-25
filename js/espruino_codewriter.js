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
    // Ability to write code onto the Espruino Board
    Espruino["CodeWriter"] = {};
    Espruino.CodeWriter.resetBeforeSend = true;

    Espruino.CodeWriter.init = function() {};
    Espruino.CodeWriter["initOptions"] = function(){
      Espruino.Options.optionFields.push({id:"#resetBeforeSend",module:"CodeWriter",field:"resetBeforeSend",type:"check"});
    };
    
    Espruino.CodeWriter.resetEspruino = function (callback) {
      Espruino.Serial.write("reset();\n"); // \x3 is ctrl-c - just make sure we break out of everything
      setTimeout(callback, 500);
    };
    
    Espruino.CodeWriter.writeToEspruino = function (code) {  
      code = Espruino.CodeWriter.reformatCode(code);
      
      var realSendSerial = function(data) {
        console.log("Sending... "+data);
        Espruino.Serial.write("echo(0);\n" + data + "\necho(1);\n");
//        Espruino.Serial.write(data);
      };
      var sendSerial = realSendSerial;
      
      if (Espruino.CodeWriter.resetBeforeSend) {
        sendSerial = function(data) { 
          Espruino.CodeWriter.resetEspruino( function() {
            realSendSerial(data);
          });
        };
      }          
      
      if(Espruino.Minify.sendMinified === true){
        Espruino.Minify.MinifyCode(code,sendSerial);
      } else {
        sendSerial(code);
      }      
    };
    
    /// Parse and fix issues like `if (false)\n foo` in the root scope
    Espruino.CodeWriter.reformatCode = function (code) {      
      var resultCode = "";
      /** we're looking for:
       *   `a = \n b`
       *   `for (.....) \n X`
       *   `if (.....) \n X`
       *   `while (.....) \n X`
       *   `do \n X`
       *   `function (.....) \n X`   
       *   `function N(.....) \n X`
       *   
       *   These are divided into two groups - where there are brackets
       *   after the keyword (statementBeforeBrackets) and where there aren't
       *   (statement)
       *   
       *   We fix them by replacing \n with what you get when you press
       *   Alt+Enter (Ctrl + LF). This tells Espruino that it's a newline
       *   but NOT to execute. 
       */ 
      var lex = Espruino.General.getLexer(code);
      var brackets = 0;
      var statementBeforeBrackets = false;
      var statement = false;
      var lastIdx = 0;
      var lastTok;
      var tok = lex.next();
      while (tok!==undefined) {
        var previousString = code.substring(lastIdx, tok.startIdx);
        var tokenString = code.substring(tok.startIdx, tok.endIdx);
        //console.log("prev "+JSON.stringify(previousString)+"   next "+tokenString);
        
        if (tok.str==")" || tok.str=="}" || tok.str=="]") brackets--;
        if (brackets==0) {
          if (statement || statementBeforeBrackets) {
            //console.log("Possible"+JSON.stringify(previousString));
            previousString = previousString.replace(/\n/g, "\x1B\x0A");
          }
        }
        if (tok.str=="(" || tok.str=="{" || tok.str=="[") brackets++;
        
        if (brackets==0) {
          if (tok.str=="for" || tok.str=="if" || tok.str=="while" || tok.str=="function") {
            statementBeforeBrackets = true;
          } else if (tok.type=="ID" && lastTok!==undefined && lastTok.str=="function") {
            statementBeforeBrackets = true;
          } else if (tok.str==")" && statementBeforeBrackets) {            
            statementBeforeBrackets = false;
            statement = true;
          } else if (tok.str=="=" || tok.str=="do") {
            statement = true;
          } else {            
            statement = false;
            statementBeforeBrackets = false;
          }          
        }
        // add our stuff back together
        resultCode += previousString + tokenString;
        // next
        lastIdx = tok.endIdx;
        lastTok = tok;
        tok = lex.next();               
      }
      //console.log(resultCode);
      return resultCode;
    };
    
})();
