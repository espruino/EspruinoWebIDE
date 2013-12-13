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
    
})();
