/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  List of Serial Ports, and handles connection and disconnection
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  var connectButton;
  
  function init() {
    connectButton = Espruino.Core.Layout.addIcon({ name: "connect", title : "Connect / Disconnect", order: -1000, area: "left" }, toggleConnection);
    
    $('<select class="serial_devices"></select>').appendTo(".toolbar .left");
    /*$('<button class="refresh">Refresh Serial Port List</button>').appendTo(".toolbar .left");
    $('<button class="open">Connect</button>').appendTo(".toolbar .left");
    $('<button class="close">Disconnect</button>').appendTo(".toolbar .left");
    
    $( ".refresh" ).button({ text: false, icons: { primary: "ui-icon-refresh" } }).click(refreshPorts);
    $( ".open" ).button({ text: false, icons: { primary: "ui-icon-play" } }).click(openSerial);
    $( ".close" ).button({ text: false, icons: { primary: "ui-icon-stop" } }).click(closeSerial);*/

    refreshPorts();
    
    $(".serial_devices").prop('disabled', false);
    $(".refresh").button( "option", "disabled", false);
    $(".open").button( "option", "disabled", false);    
    $(".close").button( "option", "disabled", true); 
    
    Espruino.addProcessor("connected", function(data, callback) {
      $(".serial_devices").prop('disabled', true);
      $(".refresh").button( "option", "disabled", true);
      $(".open").button( "option", "disabled", true);    
      $(".close").button( "option", "disabled", false);   
      callback(data);
    });
    Espruino.addProcessor("disconnected", function(data, callback) {
      $(".serial_devices").prop('disabled', false);
      $(".refresh").button( "option", "disabled", false);
      $(".open").button( "option", "disabled", false);    
      $(".close").button( "option", "disabled", true);    
      callback(data);
    });    
  }
 
  function toggleConnection() {
    if (Espruino.Core.Serial.isConnected()) {
      closeSerial();
    } else {
      openSerial();
    }
    if (Espruino.Core.Serial.isConnected()) {
      connectButton.setIcon("connect");
    } else {
      connectButton.setIcon("disconnect");
    }
  }
  

  function refreshPorts() {
    console.log("Refreshing ports...");
    $(".serial_devices").find("option").remove();
 
    Espruino.Core.Serial.getPorts(function(items) {
      var selected = -1;

      if (Espruino.Core.Utils.isWindows()) {
        // Com ports will just be COM1,COM2,etc
        // Chances are that the largest COM port is the one for Espruino:
        items.sort(function(a,b) {        
          if (a.indexOf("COM")==0 && b.indexOf("COM")==0)
            return parseInt(a.substr(3)) - parseInt(b.substr(3));
          else
            return a.localeCompare(b);
        });
        if (items.length > 0)
          selected = items.length-1;
      } else { 
        // Everyone else probably has USB in the name (or it might just be the first device)
        for (var i=0; i<items.length; i++) {
          if (i==0 || (/usb/i.test(items[i])  && /tty/i.test(items[i]))) {
            selected = i;
          }
        }
      }
      // add to menu
      for (var i=0; i<items.length; i++) {
        $(".serial_devices").append($("<option></option>").attr("value",items[i]).text(items[i]));
      }
      // select in menu
      if (selected >= 0) {
        console.log("auto-selected "+items[selected]);
        $(".serial_devices option").eq(items[selected]).prop("selected",true);
      }
    });
  };
  
  function openSerial() {
    var serialPort=$(".serial_devices").val();
    if (!serialPort) {
      Espruino.Core.Status.setError("Invalid Serial Port");
      return;
    }
    Espruino.Core.Status.setStatus("Connecting");
    Espruino.Core.Serial.setSlowWrite(true);
    Espruino.Core.Serial.open(serialPort, function(cInfo) {
      if (cInfo!=undefined) {
        console.log("Device found (connectionId="+cInfo.connectionId+")");        
        Espruino.Core.Terminal.grabSerialPort();
        Espruino.callProcessor("connected");
      //  Espruino.Process.getProcess(setBoardConnected);
      } else {
        // fail
        Espruino.callProcessor("disconnected");
        Espruino.Core.Status.setStatus("Connect Failed.");
      }
    }, function () {
      console.log("Force disconnect");
      closeSerial(); // force disconnect
    });
    function setBoardConnected(){
      Espruino.Core.Status.setStatus("Connected");
      Espruino.Board.setBoard(Espruino.Process.Env.BOARD);
    }
  };

  function closeSerial() {
    Espruino.Core.Serial.close(function(result) {
      Espruino.callProcessor("disconnected");
      Espruino.Core.Status.setStatus("Disconnected");
    });
  };

  
  Espruino.Core.PortList = {
      init : init,
  };
}());