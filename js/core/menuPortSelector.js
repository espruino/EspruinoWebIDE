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
    
    Espruino.addProcessor("connected", function(data, callback) {
      connectButton.setIcon("disconnect");
      $(".serial_devices").prop('disabled', true);
      callback(data);
    });
    Espruino.addProcessor("disconnected", function(data, callback) {
      connectButton.setIcon("connect");
      $(".serial_devices").prop('disabled', false);
      callback(data);
    });    
  }
 
  function toggleConnection() {
    if (Espruino.Core.Serial.isConnected()) {
      closeSerial();
    } else {
      createPortSelector();
    }
  }
  
  function createPortSelector() {
    var popup = Espruino.Core.Layout.addPopup("Loading...", {
      title: "Select Port",
      position: "center",
    });
    
    Espruino.Core.Serial.getPorts(function(items) {
      var html = '<div class="port_selector">';
      for (var i in items) {
        var port = items[i];
        html += '<div class="port" port="'+port+'">'+
                  '<div class="icon-usb lrg"></div>'+
                  '<div class="port_name">'+port+'</div>'+
                '</div>';
      }
      html += '</div>';      
      popup.html(html);      
      $(".port_selector .port").click(function () {
        popup.close();
        openSerial($(this).attr("port"));
      });
    });
  }
  
  function openSerial(serialPort) {
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

  
  Espruino.Core.MenuPortSelector = {
      init : init,
  };
}());