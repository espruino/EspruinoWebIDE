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
  if (chrome.serial.getDevices===undefined) {
    // wrong chrome version
    console.log("Chrome does NOT have post-M33 serial API");
    return;
  }  

  function init() {
    Espruino.Core.Config.add("BAUD_RATE", {
      section : "Communications",
      name : "Baud Rate",
      description : "When connecting over serial, this is the baud rate that is used. 9600 is the default for Espruino",
      type : {9600:9600,14400:14400,19200:19200,28800:28800,38400:38400,57600:57600,115200:115200},
      defaultValue : 9600, 
    });
  }  
  
  var connectionInfo;
  var readListener;
  var connectedPort; // unused?
  var connectionDisconnectCallback;

  // For throttled write
  var slowWrite = true;
  var writeData = undefined;
  var writeInterval = undefined;

  
  var startListening=function(callback) {
    var oldListener = readListener;
    readListener = callback;
    return oldListener;
  };

  var getPorts=function(callback) {
    chrome.serial.getDevices(function(devices) {

      var prefix = "";
      // Workaround for Chrome v34 bug - http://forum.espruino.com/conversations/1056/#comment16121
      // In this case, ports are reported as ttyACM0 - not /dev/ttyACM0      
      if (navigator.userAgent.indexOf("Linux")>=0) {
        hasSlashes = false;
        devices.forEach(function(device) { if (device.path.indexOf("/")>=0) hasSlashes=true; });
        if (!hasSlashes) prefix = "/dev/";
      }

      callback(devices.map(function(device) {
        return prefix+device.path;
      }));
    });
  };
  
  var openSerial=function(serialPort, openCallback, disconnectCallback) {
    connectionDisconnectCallback = disconnectCallback;
    chrome.serial.connect(serialPort, {bitrate: parseInt(Espruino.Config.BAUD_RATE)}, 
      function(cInfo) {
        if (!cInfo) {
          console.log("Unable to open device (connectionInfo="+cInfo+")");
          openCallback(undefined);
        } else {
          connectionInfo = cInfo;
          connectedPort = serialPort;
          console.log(cInfo);
          Espruino.callProcessor("connected", undefined, function() {
            openCallback(cInfo);
          });          
        }        
    });
  };

  var writeSerialDirect = function(str) {
    chrome.serial.send(connectionInfo.connectionId, str2ab(str), function() {}); 
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
   if (writeInterval!==undefined) 
     clearInterval(writeInterval);
   writeInterval = undefined;
   writeData = undefined;

   connectionDisconnectCallback = undefined;
   if (connectionInfo) {
     chrome.serial.disconnect(connectionInfo.connectionId, 
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
    
    var blockSize = slowWrite ? 30 : 512; // not sure how, but v33 serial API seems to lose stuff if we don't sent it at once

    showStatus &= writeData.length>blockSize;
    if (showStatus) {
      Espruino.Core.Status.setStatus("Sending...", writeData.length);
      console.log("---> "+JSON.stringify(data));
    }

    if (writeInterval===undefined) {
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
        writeInterval = setInterval(sender, 100);
      } else {
        if (showStatus)
          Espruino.Core.Status.setStatus("Sent");
      }
    }
  };
  
  // ----------------------------------------------------------
  chrome.serial.onReceive.addListener(function(receiveInfo) {
    //var bytes = new Uint8Array(receiveInfo.data);
    if (readListener!==undefined) readListener(receiveInfo.data);
  });

  chrome.serial.onReceiveError.addListener(function(errorInfo) {
    console.log("RECEIVE ERROR:",JSON.stringify(errorInfo));
    connectionDisconnectCallback();
  });

  Espruino.Core.Serial = {
    "init" : init,
    "getPorts": getPorts,
    "open": openSerial,
    "isConnected": isConnected,
    "startListening": startListening,
    "write": writeSerial,
    "close": closeSerial,
	"isSlowWrite": function() { return slowWrite; },
	"setSlowWrite": function(isOn, force) { 
        if ((!force) && Espruino.Config.SERIAL_THROTTLE_SEND) {
          console.log("ForceThrottle option is set - set Slow Write = true");
          isOn = true;
        } else
  	    console.log("Set Slow Write = "+isOn);
	  slowWrite = isOn; 
	},
  };
})();
