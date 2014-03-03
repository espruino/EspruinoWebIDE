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
 
   Espruino.Flasher.init = function() {
   }

   Espruino.Flasher.initOptions = function() {
     $.get("data/Espruino_FlashFirmware.html",function(data){         
       Espruino.Options.optionBlocks.push({module:"Flasher",buttonLine:0,id:"#divOptionFlashFirmware",htmlData:data, onForm:function() {
         // Set up the firmware flasher button
         $( "#flashFirmware" ).button().click(Espruino.Flasher.flashButtonClicked);
         // Set up the URL
         var boardInfo = Espruino.Board.getBoardObject();
         if (boardInfo && boardInfo.info.binary_url !== undefined)
           $("#flashFirmwareUrl").val(boardInfo.info.binary_url);
         // Set up warning
         var chromeVer = navigator.userAgent.replace(/.*Chrome\/([0-9]*).*/,"$1");
         if (chromeVer < 31) {
           $("#flashFirmwareInfo").css("color","red").html("Your Chrome version is "+chromeVer+". Please upgrade it before trying to flash your Espruino board.");
         }
       }});
     });
    };

    var getBinary = function(url, callback) {
      console.log("Downloading "+url);
      Espruino.Status.setStatus("Downloading binary...");
      var xhr = new XMLHttpRequest();          
      xhr.responseType = "arraybuffer";
      xhr.addEventListener("load", function () {
        if (xhr.status === 200) {
          Espruino.Status.setStatus("Done.");
          var data = xhr.response;
          callback(undefined,data);
        } else
          callback("Download error.");
      });
      xhr.addEventListener("error", function () {
        callback("Download error.");
      });
      xhr.open("GET", url, true);
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
      }, 70);
      dataReceived = function (c) {
        console.log("got "+c);
        if (c==ACK || c==NACK) {
          clearTimeout(iTimeout);
          clearInterval(iPoll);
          if (!Espruino.Status.hasProgress())
            Espruino.Status.setStatus("Initialised.");
          console.log("Initialised. Just waiting for a bit...");
		  // wait for random extra data...
		  dataReceived = function(c){
		    console.log("Already ACKed but got "+c);
		  };
		  setTimeout(function() {
		    dataReceived = undefined;
			// finally call callback
		    bodgeClock(callback);
	      }, 500);
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
        data[dataCount++] = c;        
        if (dataCount == count) {
          clearTimeout(iTimeout);
          dataReceived = undefined;
          callback(undefined,data);
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
    
    var readData = function(callback, addr, readBytes) {
      console.log("Reading "+readBytes+" bytes from 0x"+addr.toString(16)+"...");
      // send read command
      sendCommand(0x11, function(err) {
        if (err) { 
          console.log("Error sending command ("+err+").");
          callback(err); 
          return; 
        }        
        // send address
        sendData([(addr>>24)&0xFF,(addr>>16)&0xFF,(addr>>8)&0xFF,addr&0xFF], function(err) {
          if (err) { 
            console.log("Error sending address. ("+err+")");
            callback(err); 
            return; 
          }
          // send amount of bytes we want
          sendData([readBytes-1], function(err) {
            if (err) { 
              console.log("Error while reading. ("+err+")");
              callback(err);
              return;
            }  
            receiveData(readBytes, /*function(err) {
              if (err) { 
                console.log("Error while reading. retrying...");
                initialiseChip(function (err) {
                  if (err) callback(err);
                  else readData(callback, addr, readBytes);
                }, 10000);
                return;
              }
              callback(undefined, data);
            }*/callback, 1000);
          }, 2000/*timeout*/);
        });                 
      });
    };

	var bodgeClock = function(callback) {
	  /* 1v43 bootloader ran APB1 at 9Mhz, which isn't enough for
	  some STM32 silicon, which has a bug. Instead, set the APB1 clock
	  using the bootloader write command, which will fix it up enough for
      flashing.	  */
	  var RCC_CFGR = 0x40021004;
	  readData(function(err, data) {
	    if (err) return callback(err);
		var word = (data[3]<<24) | (data[2]<<16) | (data[1]<<8) | data[0];
		console.log("RCC->CFGR = "+word);
		var newword = (word&0xFFFFF8FF) | 0x00000400;
		if (newword==word) {
		  console.log("RCC->CFGR is correct");
		  callback(undefined);
		} else {
		  console.log("Setting RCC->CFGR to "+newword);
		  writeData(callback, RCC_CFGR, [newword&0xFF, (newword>>8)&0xFF, (newword>>16)&0xFF, (newword>>24)&0xFF]);
		}
	  }, RCC_CFGR, 4);
	}
	
    var writeData = function(callback, addr, data) {
      if (data.length>256) callback("Writing too much data");
      console.log("Writing "+data.length+" bytes at 0x"+addr.toString(16)+"...");
      // send write command
      sendCommand(0x31, function(err) {
        if (err) { 
          console.log("Error sending command ("+err+"). retrying...");
          initialiseChip(function (err) {
            if (err) callback(err);
            else writeData(callback, addr, data);
          }, 30000);
          return; 
        }        
        // send address
        sendData([(addr>>24)&0xFF,(addr>>16)&0xFF,(addr>>8)&0xFF,addr&0xFF], function(err) {
          if (err) { 
            console.log("Error sending address ("+err+"). retrying...");
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
              console.log("Error while writing ("+err+"). retrying...");
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
    
    var writeAllData = function(binary, callback) {      
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
            data[offset+i] = dataChunk[i];
          Espruino.Status.incrementProgress(chunkSize);
          reader(offset + chunkSize);
        }, 0x08000000 + offset, chunkSize);
      };
      reader(FLASH_OFFSET);
    };    
    
    Espruino.Flasher.flashDevice = function(url, callback) {
      getBinary(url, function (err, binary) {
        if (err) { callback(err); return; }
        console.log("Downloaded "+binary.byteLength+" bytes");
        // add serial listener
        dataReceived = undefined;
        Espruino.Serial.startListening(function (readData) {
          var bufView=new Uint8Array(readData);
          //console.log("Got "+bufView.length+" bytes");
          for (var i=0;i<bufView.length;i++) bytesReceived.push(bufView[i]);
          if (dataReceived!==undefined) {
            for (var i=0;i<bytesReceived.length;i++) {
              if (dataReceived===undefined) console.log("OH NO!");
              dataReceived(bytesReceived[i]);
            }
            bytesReceived = [];
          }
        });
		var hadSlowWrite = Espruino.Serial.isSlowWrite();
		Espruino.Serial.setSlowWrite(false);
		var finish = function(err) {
		  Espruino.Serial.setSlowWrite(hadSlowWrite);
		  callback(err);
		};
        // initialise
        initialiseChip(function (err) {
          if (err) { finish(err); return; }
          eraseChip(function (err) {
            if (err) { finish(err); return; }
            writeAllData(binary, function (err) {
              if (err) { finish(err); return; }
              finish();
            });
          });
          /*readAllData(binary.byteLength, function(err,chipData) {
            if (err) {
              finish(err);              
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

    Espruino.Flasher.checkBoardInfo = function(boardInfo) {
      //console.log(boardInfo);
      if (boardInfo.info.binary_url !== undefined) {
        $("#flashFirmwareUrl").val(boardInfo.info.binary_url);
        if (Espruino.Process.Env.VERSION!==undefined && boardInfo.info.binary_version!==undefined) {
          console.log("FIRMWARE: Current "+Espruino.Process.Env.VERSION+", Available "+boardInfo.info.binary_version);
          var vCurrent = Espruino.General.versionToFloat(Espruino.Process.Env.VERSION);
          var vAvailable = Espruino.General.versionToFloat(boardInfo.info.binary_version);
          if (vCurrent > 1.43) {
            console.log("Firmware >1.43 supports faster writes");
            Espruino.Serial.setSlowWrite(false);
          }
          if (vAvailable > vCurrent && Espruino.Process.Env.BOARD=="ESPRUINOBOARD") {
            console.log("New Firmware "+boardInfo.info.binary_version+" available");
            Espruino.Status.setStatus("New Firmware "+boardInfo.info.binary_version+' available. Click <div style="display: inline-block" class="ui-state-default"><span class="ui-icon ui-icon-info"></span></div>  to update');
          }
        }
      }
    };
    
    Espruino.Flasher.flashButtonClicked = function() {
      if (!Espruino.Serial.isConnected()) {
        Espruino.Status.setStatus("Must be connected first.");
        return;
      }
      var url = $("#flashFirmwareUrl").val().trim();
      if (url=="") {
        Espruino.Status.setStatus("You must provide a firmware URL!");
        return;
      }
      Espruino.Flasher.flashDevice(url ,function (err) {
        Espruino.Terminal.grabSerialPort();
        if (err) {
          Espruino.Status.setStatus("Error Flashing.");
          console.log(err);
          //alert(err);
        }
        else Espruino.Status.setStatus("Done.");
      });
    };

})();
