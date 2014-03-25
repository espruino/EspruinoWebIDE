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

(function() {
  if (chrome.serial.getPorts===undefined) {
    // wrong chrome version
    console.log("Chrome does NOT have pre-M33 serial API");
    return;
  } 
  
  var connectionInfo;
  var readListener;
  var connectionChecker;
  var connectedPort;

  // For throttled write
  var slowWrite = true;
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
      throw "You must call openSerial first!";
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
      if (readListener) readListener(readInfo.data);
    }
    chrome.serial.read(connectionInfo.connectionId, 1024, onCharRead);
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
          connectedPort = serialPort;
          connectionChecker = setInterval(checkConnection, 500);          
          Espruino.callProcessor("connected", undefined, function() {
            openCallback(cInfo);
          });
        }        
    });
  };

  var writeSerialDirect = function(str) {
    chrome.serial.write(connectionInfo.connectionId, str2ab(str), onWrite); 
  };
  
  var onWrite=function(obj) {
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
        Espruino.callProcessor("disconnected");
        if (callback) callback(result);
      });
    }
  };
   
  var isConnected = function() {
    return connectionInfo!=null && connectionInfo.connectionId>=0;
  };

  // Throttled serial write
  var writeSerial = function(data, showStatus) {
    if (!isConnected()) return; // throw data away
    if (showStatus===undefined) showStatus=true;
    
    /*var d = [];
    for (var i=0;i<data.length;i++) d.push(data.charCodeAt(i));
    console.log("Write "+data.length+" bytes - "+JSON.stringify(d));*/
    
    /* Here we queue data up to write out. We do this slowly because somehow 
    characters get lost otherwise (compared to if we used other terminal apps
    like minicom) */
    if (writeData == undefined)
      writeData = data;
    else
      writeData += data;    
    
    var blockSize = slowWrite ? 30 : 1024;

    showStatus &= writeData.length>blockSize;
    if (showStatus) {
      Espruino.Core.Status.setStatus("Sending...", writeData.length);
      console.log("Sending "+JSON.stringify(data));
    }

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
          if (showStatus) 
            Espruino.Core.Status.incrementProgress(d.length);
        } 
        if (writeData==undefined && writeInterval!=undefined) {
          clearInterval(writeInterval);
          writeInterval = undefined;
          if (showStatus) 
            Espruino.Core.Status.setStatus("Sent");
        }
      }
      sender(); // send data instantly
      // if there was any more left, do it after a delay
      if (writeData!=undefined) {
        writeInterval = setInterval(sender, 60);
      } else {
        if (showStatus)
          Espruino.Core.Status.setStatus("Sent");
      }
    }
  };

  Espruino.Core.Serial = {
    "getPorts": getPorts,
    "open": openSerial,
    "isConnected": isConnected,
    "startListening": startListening,
    "write": writeSerial,
    "close": closeSerial,
	"isSlowWrite": function() { return slowWrite; },
	"setSlowWrite": function(isOn) { 
	  console.log("Set Slow Write = "+isOn);
	  slowWrite = isOn; 
	}	
  };
})();
