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
    // Code to re-flash Espruino via Web IDE
    Espruino["Flasher"] = {};

    var dataReceived = undefined; // listener for when data is received
    var bytesReceived = []; // list of characters for when no handler is specified

    var ACK = 0x79;
    var NACK = 0x1F;
    
    Espruino.Flasher.init = function(){
    };

    var getBinary = function(url, callback) {
      console.log("Downloading "+url);
      Espruino.Status.setStatus("Downloading binary...");
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);    
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

    var initialiseChip = function(callback, timeout) {
      if (!Espruino.Status.hasProgress()) 
        Espruino.Status.setStatus("Initialising...");
      console.log("Initialising...");
      var iTimeout = setTimeout(function() {
        dataReceived = undefined;
        clearInterval(iPoll);
        callback("Can't find STM32 bootloader. Make sure the chip is reset with BOOT0=1 and BOOT1=0");
      }, (timeout==undefined)?10000:timeout);      
      var iPoll = setInterval(function() {
        console.log("Sending... 0x7F");
        Espruino.Serial.write("\x7f", false);
      }, 200);
      dataReceived = function (c) {
        dataReceived = undefined;
        console.log("got "+c);
        if (c==ACK || c==NACK) {
          clearTimeout(iTimeout);
          clearInterval(iPoll);
          if (!Espruino.Status.hasProgress())
            Espruino.Status.setStatus("Initialised.");
          console.log("Initialised.");
          callback(undefined);
        }
      };
    };

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
      };   
    };

    var sendData = function(data, callback, timeout) {
      var s = "";
      var chksum = 0;
      for (var i in data) {
        chksum = chksum ^ data[i];
        s += String.fromCharCode(data[i]);
      }
      Espruino.Serial.write(s + String.fromCharCode(chksum), false);
      waitForACK(callback, timeout);
    };

    var receiveData = function(count, callback, timeout) {
      var data = new Uint8Array(count);
      var dataCount = 0;
      var iTimeout = setTimeout(function() {
        dataReceived = undefined;
        callback("Timeout reading "+count+" bytes");
      }, timeout?timeout:2000);   
      dataReceived = function (c) {
        console.log(dataCount);
        data[dataCount++] = c;        
        if (dataCount == count) {
          clearTimeout(iTimeout);
          dataReceived = undefined;
          callback(0,data);
        }
      };   
    };    
    
    var sendCommand = function(command, callback) {
      Espruino.Serial.write(String.fromCharCode(command) + String.fromCharCode(0xFF ^ command), false);
      waitForACK(callback);
    };

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
    };
    
    var readData = function(callback, addr) {
      var readBytes = 256;
      console.log("Reading "+readBytes+" bytes from 0x"+addr.toString(16)+"...");
      // send read command
      sendCommand(0x11, function(err) {
        if (err) { 
          console.log("Error sending command.");
          callback(err); 
          return; 
        }        
        // send address
        sendData([(addr>>24)&0xFF,(addr>>16)&0xFF,(addr>>8)&0xFF,addr&0xFF], function(err) {
          if (err) { 
            console.log("Error sending address.");
            callback(err); 
            return; 
          }
          // send amount of bytes we want
          sendData([readBytes-1], function(err) {
            if (err) { 
              console.log("Error while reading.");
              callback(err); 
              return;
            }  
            receiveData(readBytes, callback, 1000);
          }, 2000/*timeout*/);
        });                 
      });
    };

    var writeData = function(callback, addr, data) {
      if (data.length>256) callback("Writing too much data");
      console.log("Writing "+data.length+" bytes at 0x"+addr.toString(16)+"...");
      // send write command
      sendCommand(0x31, function(err) {
        if (err) { 
          console.log("Error sending command. retrying...");
          initialiseChip(function (err) {
            if (err) callback(err);
            else writeData(callback, addr, data);
          }, 30000);
          return; 
        }        
        // send address
        sendData([(addr>>24)&0xFF,(addr>>16)&0xFF,(addr>>8)&0xFF,addr&0xFF], function(err) {
          if (err) { 
            console.log("Error sending address. retrying...");
            initialiseChip(function (err) {
              if (err) callback(err);
              else writeData(callback, addr, data);
            }, 30000);
            return; 
          }
          // work out data to send
          var sData = [ data.length-1 ];
          for (var i in data) sData.push(data[i]&0xFF);
          // send data
          sendData(sData, function(err) {
            if (err) { 
              console.log("Error while writing. retrying...");
              initialiseChip(function (err) {
                if (err) callback(err);
                else writeData(callback, addr, data);
              }, 30000);
              return;
            }  
            callback(undefined); // done
          }, 2000/*timeout*/);
        });                 
      });
    };
    
    var FLASH_OFFSET = 1024*10 /* no bootloader */;
    
    var writeAllData = function(binary) {      
      var chunkSize = 256;
      console.log("Writing "+binary.byteLength+" bytes");
      Espruino.Status.setStatus("Writing flash...",  binary.byteLength);
      var writer = function(offset) {
        if (offset>=binary.byteLength) {
          Espruino.Status.setStatus("Write complete!");
          callback(undefined); // done
          return;
        }
        var len = binary.byteLength - offset;
        if (len > chunkSize) len = chunkSize;              
        var data = new Uint8Array(binary, offset, len);
        writeData(function(err) {
          if (err) { callback(err); return; }
          Espruino.Status.incrementProgress(chunkSize);
          writer(offset + chunkSize);
        }, 0x08000000 + offset, data);
      };
      writer(FLASH_OFFSET);
    };
    
    var readAllData = function(binaryLength, callback) {
      var data = new Uint8Array(FLASH_OFFSET);            
      var chunkSize = 256;
      console.log("Reading "+binaryLength+" bytes");
      Espruino.Status.setStatus("Reading flash...",  binaryLength);
      var reader = function(offset) {
        if (offset>=binaryLength) {
          Espruino.Status.setStatus("Read complete!");
          callback(undefined, data); // done
          return;
        }
        var len = binaryLength - offset;
        if (len > chunkSize) len = chunkSize;              
        readData(function(err, dataChunk) {
          if (err) { callback(err); return; }
          for (var i in dataChunk)
            data.push(dataChunk[i]);
          Espruino.Status.incrementProgress(chunkSize);
          reader(offset + chunkSize);
        }, 0x08000000 + offset);
      };
      reader(FLASH_OFFSET);
    };    
    
    Espruino.Flasher.flashDevice = function(url, callback) {
      getBinary(url, function (err, binary) {
        if (err) { callback(err); return; }
        console.log("Downloaded "+binary.byteLength+" bytes");
        // add serial listener
        Espruino.Serial.startListening(function (readData) {
          var bufView=new Uint8Array(readData);
          for (var i=0;i<bufView.length;i++) bytesReceived.push(bufView[i]);
          if (dataReceived) {
            for (var i=0;i<bytesReceived.length;i++) 
              dataReceived(bytesReceived[i]);
            bytesReceived = [];
          }
        });
        // initialise
        initialiseChip(function (err) {
          if (err) { callback(err); return; }
          eraseChip(function (err) {
            if (err) { callback(err); return; }
            writeAllData(binary);
          });
          /*readAllData(binary.byteLength, function(err,chipData) {
            if (err!==undefined) {
              callback(err);              
              return;
            }
            var errors = 0;
            var needsErase = false;
            var binaryData = new Uint8Array(binary, 0, binary.byteLength);
            for (var i=FLASH_OFFSET;i<binary.byteLength;i++) {
              if (binaryData[i]!=chipData[i]) {
                if (chipData[i]!=0xFF) needsErase = true;
                console.log(binaryData[i]+" vs "+data[i]);
                errors++;
              }
            }
            console.log(errors+" differences, "+(needsErase?"needs erase":"doesn't need erase"));
          });*/
        });
      });
    };

})();
