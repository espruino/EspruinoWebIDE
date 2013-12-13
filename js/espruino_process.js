/*
 * The MIT License

Copyright (c) 2013 by Juergen Marsch

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
    // Code to get board's 'process.env' variable
    Espruino["Process"] = {};
    Espruino.Process.Env = {};

    Espruino.Process.init = function() {};
    Espruino.Process.setProcess = setProcess;
    
    Espruino.Process.getProcess = function(callback){
      var prevReader,bufText = "";
      if(Espruino.Serial.isConnected()){
        prevReader = Espruino.Serial.startListening(function (readData){
          var bufView=new Uint8Array(readData);
          for(var i = 0; i < bufView.length; i++){
            bufText += String.fromCharCode(bufView[i]);
          }
        });
        // string adds to stop the command tag being detected in the output
        Espruino.Serial.write('\necho(0);\nconsole.log("<<"+"<<<"+JSON.stringify(process.env)+">>>"+">>");\necho(1);\n');
        setTimeout(function(){
          Espruino.Serial.startListening(prevReader);
          console.log("Got "+JSON.stringify(bufText));          
          var startProcess = bufText.indexOf("<<<<<");
          var endProcess = bufText.indexOf(">>>>>", startProcess);
          if(startProcess >= 0 && endProcess > 0){
            var pText = bufText.substring(startProcess + 5,endProcess);            
            Espruino.Process.Env = JSON.parse(pText);
            callback();
          }
        },500);        
      }
    };
    function setProcess(data){
      if($.isEmptyObject(data)){ Espruino.Process.Env = {};}
      else{Espruino.Process.Env = {BOARD:data.info.name};}
    }
})();
