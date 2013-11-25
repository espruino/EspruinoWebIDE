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
(function(){
    // Code to load and save configuration options
    Espruino["Process"] = {};
    Espruino.Process.Env = {};

    Espruino.Process.init = function() {
    };
    
    Espruino.Process.getProcess = function(callback){
      var prevReader,bufText = "";
      if(serial_lib.isConnected()){
        prevReader = serial_lib.startListening(onRead);
        // string adds to stop the command tag being detected in the output
        serial_lib.write('\necho(0);\nconsole.log("<<"+"<<<"+JSON.stringify(process.env)+">>>"+">>");echo(1);\n');
        setTimeout(function(){
          serial_lib.startListening(prevReader);
          var startProcess = bufText.indexOf("<<<<<");endProcess = bufText.indexOf(">>>>>", startProcess);
          if(startProcess >= 0 && endProcess > 0){
            var pText = bufText.substring(startProcess + 5,endProcess);
            console.log("Got \""+pText+"\"");
            Espruino.Process.Env = JSON.parse(pText);
            callback();
          }
        },500);
        function onRead(readData){
          var bufView=new Uint8Array(readData);
          var startProcess = 0;endProcess = 0;
          for(var i = 0; i < bufView.length; i++){
            bufText += String.fromCharCode(bufView[i]);
          }
        }
      }
    };
})();
