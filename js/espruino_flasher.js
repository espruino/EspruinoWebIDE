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
    // Code to re-flash Espruino via Web IDE
    Espruino["Flasher"] = {};

    var serial_lib = undefined
    var dataReceived = undefined; // listener for when data is received

    var ACK = 0x79;
    var NACK = 0x1F;
    
    Espruino.Flasher.init = function(){
    };

    var getBinary = function(filename, callback) {
      Espruino.Status.setStatus("Downloading binary...");
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "http://www.espruino.com/binaries/"+filename, true);    
      xhr.responseType = "arraybuffer";
      xhr.addEventListener("load", function () {
        if (xhr.status === 200) {
          Espruino.Status.setStatus("Done.");
          var data = xhr.response;
          callback(undefined,data);
        } else
          callback("Download error.");
      });
      xhr.send(null);
    };

    var initialiseChip = function(callback) {
      Espruino.Status.setStatus("Initialising...");
      var iTimeout = setTimeout(function() {
        dataReceived = undefined;
        clearInterval(iPoll);
        callback("Can't find STM32 bootloader. Make sure the chip is reset with BOOT0=1 and BOOT1=0");
      }, 5000);      
      var iPoll = setInterval(function() {
        console.log("Sending... 0x7F");
        serial_lib.write("\x7f");
      }, 500);
      dataReceived = function (c) {
        dataReceived = undefined;
        console.log("got "+c);
        if (c==ACK || c==NACK) {
          clearTimeout(iTimeout);
          clearInterval(iPoll);
          Espruino.Status.setStatus("Initialised.");
          callback(undefined);
        }
      }
    }

    var waitForACK = function(callback, timeout) {
      var iTimeout = setTimeout(function() {
        dataReceived = undefined;
        callback("Timeout waiting for ACK");
      }, timeout?timeout:1000);   
      dataReceived = function (c) {
        dataReceived = undefined;
        if (c==ACK) {
          clearTimeout(iTimeout);
          callback(undefined);
        } else
          callback("Expected ACK but got "+c);
      }   
    }

    var sendData = function(data, callback, timeout) {
      var s = "";
      var chksum = 0;
      for (i in data) {
        chksum = chksum ^ data[i];
        s += String.fromCharCode(data[i]);
      }
      serial_lib.write(s + String.fromCharCode(chksum));
      waitForACK(callback, timeout);
    }

    var sendCommand = function(command, callback) {
      serial_lib.write(String.fromCharCode(command) + String.fromCharCode(0xFF ^ command));
      waitForACK(callback);
    }

    var eraseChip = function(callback) {
      Espruino.Status.setStatus("Erasing...");
      // Extended erase
      sendCommand(0x44, function(err) {
        if (err) { callback(err); return; }
        console.log("We may be some time...");
        sendData([0xFF,0xFF], function(err) {
          if (err) { callback(err); return; }
          callback(undefined);
        }, 20000/*timeout*/);                 
      });
    }

    var writeData = function(callback, addr, data) {
      if (data.length>256) callback("Writing too much data");
      Espruino.Status.setStatus("Writing "+data.length+" bytes at 0x"+addr.toString(16)+"...");
      // send write command
      sendCommand(0x31, function(err) {
        if (err) { console.log("Error sending command"); callback(err); return; }        
        // send address
        sendData([(addr>>24)&0xFF,(addr>>16)&0xFF,(addr>>8)&0xFF,addr&0xFF], function(err) {
          if (err) { 
            console.log("Error sending address retrying...");
            initialiseChip(function (err) {
              if (err) callback(err);
              else writeData(callback, addr, data);
            });
            return; 
          }
          // work out data to send
          var sData = [ data.length-1 ];
          for (i in data) sData.push(data[i]&0xFF);
          // send data
          sendData(sData, function(err) {
            if (err) { 
              console.log("Error while writing. retrying...");
              initialiseChip(function (err) {
                if (err) callback(err);
                else writeData(callback, addr, data);
              });
              return;
            }  
            callback(undefined); // done
          }, 2000/*timeout*/);
        });                 
      });
    }
    
    Espruino.Flasher.flashDevice = function(_serial_lib, callback) {
      serial_lib = _serial_lib;
      getBinary("espruino_r1v1_1v42.bin", function (err, binary) {
        if (err) { callback(err); return; }
        console.log("Downloaded "+binary.byteLength+" bytes");
        // add serial listener
        serial_lib.startListening(function (readData) {
          var bufView=new Uint8Array(readData);
          if (dataReceived)
            for (var i=0;i<bufView.length;i++) 
              dataReceived(bufView[i]);
        });
        // initialise
        initialiseChip(function (err) {
          if (err) { callback(err); return; }
          eraseChip(function (err) {
            if (err) { callback(err); return; }
            console.log("Writing "+binary.byteLength+" bytes");
            var chunkSize = 256;
            var writer = function(offset) {
              if (offset>=binary.byteLength) {
                Espruino.Status.setStatus("Flashing complete!");
                callback(undefined); // done
                return;
              }
              var len = binary.byteLength - offset;
              if (len > chunkSize) len = chunkSize;              
              var data = new Uint8Array(binary, offset, len);
              writeData(function(err) {
                if (err) { callback(err); return; }
                writer(offset + chunkSize);
              }, 0x08000000 + offset, data);
            }
            writer(1024*10 /* no bootloader */);
          });
        });
      });
    };

})();
