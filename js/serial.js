/**
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Renato Mangini (mangini@chromium.org)
Author: Luis Leao (luisleao@gmail.com)
Author: Gordon Williams (gw@pur3.co.uk)
**/
"use strict";
var serial_lib=(function() {
  
  var connectionInfo;
  var readListener;
  var connectionChecker;
  var connectedPort;

  // For throttled write
  var writeData = undefined;
  var writeInterval = undefined;

  /** When connected, this is called every so often to check on the state
   of the serial port. If it detects a disconnection it calls the disconnectCallback
   which will force a disconnect (which means that hopefulyl chrome won't hog the
   serial port if we physically reconnect the board). */
  var checkConnection = function() {
    chrome.serial.getControlSignals(connectionInfo.connectionId, function (sigs) { 
      var connected = "cts" in sigs;
      if (!connected) {
        console.log("Detected Disconnect");
        if (connectionDisconnectCallback!=undefined)
          connectionDisconnectCallback();
      }
   });
  };
  
  var startListening=function(callback) {
    if (!connectionInfo || !connectionInfo.connectionId) {
      throw new "You must call openSerial first!";
    }
    var oldListener = readListener;
    readListener=callback;
    onCharRead();
    return oldListener;
  };

  var onCharRead=function(readInfo) {
    if (!readListener || !connectionInfo) {
      return;
    }
    if (readInfo && readInfo.bytesRead>0 && readInfo.data) {
      onRead(readInfo.data);
    }
    chrome.serial.read(connectionInfo.connectionId, 128, onCharRead);
  };

  var getPorts=function(callback) {
    chrome.serial.getPorts(callback);
  };
  
  var openSerial=function(serialPort, openCallback, disconnectCallback) {
    connectionDisconnectCallback = disconnectCallback;
    chrome.serial.open(serialPort, {bitrate: 9600}, 
      function(cInfo) {
        if (!cInfo || !cInfo.connectionId || cInfo.connectionId<0) {
          console.log("Could not find device (connectionInfo="+cInfo+")");
          if (openCallback) openCallback(undefined);
        } else {
          connectionInfo=cInfo;
          console.log(cInfo);
          if (openCallback) openCallback(cInfo);
          connectedPort = serialPort;
          connectionChecker = setInterval(checkConnection, 500);
        }        
    });
  };

  var writeSerialDirect = function(str) {
    chrome.serial.write(connectionInfo.connectionId, str2ab(str), onWrite); 
  };
  
  var onWrite=function(obj) {
  };
  
  var onRead=function(readInfo) {
    if (readListener) readListener(readInfo);
  };

  var str2ab=function(str) {
    var buf=new ArrayBuffer(str.length);
    var bufView=new Uint8Array(buf);
    for (var i=0; i<str.length; i++) {
      bufView[i]=str.charCodeAt(i);
    }
    return buf;
  };
 
 
  var closeSerial=function(callback) {
   connectionDisconnectCallback = undefined;
   if (connectionChecker) {
     clearInterval(connectionChecker);
     connectedPort = undefined;
     connectionChecker = undefined;
   }
   if (connectionInfo) {
     chrome.serial.close(connectionInfo.connectionId, 
      function(result) {
        connectionInfo=null;
        if (callback) callback(result);
      });
    }
  };
   
  var isConnected = function() {
    return connectionInfo!=null && connectionInfo.connectionId>=0;
  };

  // Throttled serial write
  var writeSerial = function(data) {
    if (!isConnected()) return; // throw data away
    
    /* Here we queue data up to write out. We do this slowly because somehow 
    characters get lost otherwise (compared to if we used other terminal apps
    like minicom) */
    if (writeData == undefined)
      writeData = data;
    else
      writeData += data;    
    
    var blockSize = 32;

    if (writeData.length>blockSize) 
      Espruino.Status.setStatus("Sending...", writeData.length);

    if (writeInterval==undefined) {
      function sender() {
        if (writeData!=undefined) {
          var d = undefined;
          if (writeData.length>blockSize) {
            d = writeData.substr(0,blockSize);
            writeData = writeData.substr(blockSize);
          } else {
            d = writeData;
            writeData = undefined; 
          }          
          writeSerialDirect(d);
          Espruino.Status.incrementProgress(d.length);
        } 
        if (writeData==undefined && writeInterval!=undefined) {
          clearInterval(writeInterval);
          writeInterval = undefined;
          if (Espruino.Status.hasProgress()) 
            Espruino.Status.setStatus("Sent");
        }
      }
      sender(); // send data instantly
      // if there was any more left, do it after a delay
      if (writeData!=undefined) {
        writeInterval = setInterval(sender, 50);
      } else {
        if (Espruino.Status.hasProgress())
          Espruino.Status.setStatus("Sent");
      }
    }
  };


  return {
    "getPorts": getPorts,
    "open": openSerial,
    "isConnected": isConnected,
    "startListening": startListening,
    "write": writeSerial,
    "close": closeSerial
  };
})();
