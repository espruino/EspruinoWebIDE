/** Relay protocol:

WebSockets, protocol name 'espruino'

Packets Sent:

'\x00' - data from BLE -> server
'\x01' - data from server -> BLE
'\x02' - server -> BLE write complete
'\x10' - connection key
'\x20' - client connected


*/

"use strict";
(function(){

  var WS_HOST = 'wss://'+window.location.host+':8443';

  var connectButton;
  var connectedSocket;

  function getUID() {
    var s = "";
    for (var i=0;i<8;i++)
      s+=(0|(Math.random()*36)).toString(36).substr(-1);
    return s;
  }
  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }

  function init() {
    Espruino.Config.FONT_SIZE = 24;
    $("#terminal").css("font-size", Espruino.Config.FONT_SIZE+"px");

    Espruino.Core.Config.add("RELAY_KEY", {
      section : "Communications",
      name : "Relay Key",
      description : "The key used for relaying Web IDE between devices",
      type : "string",
      defaultValue : getUID()
    });
    connectButton = Espruino.Core.App.addIcon({
      id: "connection",
      icon: "connect",
      title : "Connect / Disconnect",
      order: -1000,
      area: document.getElementsByClassName("toolbar").length ? {
        name: "toolbar",
        position: "left"
      } : {
        name: "terminal",
        position: "top"
      },
      click: toggleConnection
    });

    Espruino.addProcessor("connected", function(data, callback) {
      connectButton.setIcon("disconnect");
      callback(data);
      startWebSocket();
    });

    Espruino.addProcessor("disconnected", function(data, callback) {
      connectButton.setIcon("connect");
      callback(data);
    });
  }

  function term(txt) {
    Espruino.Core.Terminal.outputDataHandler(txt+"\r\n");
  }

  function toggleConnection() {
    if (Espruino.Core.Serial.isConnected()) {
      Espruino.Core.Serial.close();
    } else {
      var serialPort = 'Web Bluetooth';
      term("Connecting to "+serialPort);
      Espruino.Core.Serial.open(serialPort, function(cInfo) {
        Espruino.Core.Serial.setSlowWrite(false, true/*force*/);
        if (cInfo!=undefined) {
          console.log("Device found (connectionId="+ cInfo.connectionId +")");
          Espruino.Core.Notifications.success("Connected to "+serialPort, true);
          term("Connected to "+serialPort);
        } else {
          // fail
          Espruino.Core.Notifications.error("Connection Failed.", true);
          term("Connection Failed.");
        }
      }, function () {
        console.log("Disconnect callback...");
        term("Bluetooth connection closed");
        Espruino.Core.Notifications.warning("Disconnected", true);
      });
    }
  }


  function startWebSocket() {
    console.log("Disabling normal terminal");
    // disable terminal
    Espruino.Core.Terminal.setInputDataHandler(function(d) { });
    // Ensure that data from Espruino goes to this terminal
    Espruino.Core.Serial.startListening(BLEToSocket);

    console.log("Starting Websocket connection");
    term("Starting Websocket connection");
    // Create WebSocket connection.
    var socket = new WebSocket(WS_HOST, 'espruino');

    if (Espruino.Config.RELAY_KEY.trim().length != 8) {
      Espruino.Config.set("RELAY_KEY", getUID());
    }

    socket.addEventListener('open', function (event) {
      Espruino.Core.Notifications.success("Websocket connection open", true);
      term("Websocket connection open");
      term(" ");
      term("=============================");
      term("| RELAY KEY is    "+Espruino.Config.RELAY_KEY+"  |");
      term("=============================");
      term(" ");
      term("Please enter this in Communications -> Relay Key");
      term("in the settings for the Web IDE on your PC.");
      term(" ");
      socket.send('\x10'+Espruino.Config.RELAY_KEY);
    });
    socket.addEventListener('close', function (event) {
      socket = undefined;
      Espruino.Core.Notifications.warning("Websocket connection closed", true);
      term("Websocket connection closed");
      Espruino.Core.Serial.close();
    });
    // Listen for messages
    socket.addEventListener('message', function (event) {
      socketToBLE(event.data);
    });

    function BLEToSocket(data) {
      data = ab2str(data);
      console.log("BLE -> "+JSON.stringify(data));
      if (socket)
        socket.send('\x00'+data);
    }

    function socketToBLE(data) {
      if (data[0]=="\x01") {
        console.log("BLE <- "+JSON.stringify(data.substr(1)));
        // Data to send
        Espruino.Core.Serial.write(data.substr(1), false, function() {
          console.log("BLE sent.");
          if (socket) socket.send('\x02'); // write complete message
        });
      } else if (data[0]=="\x20") {
        term("New client connected");
      } else term("Unknown packet type "+JSON.stringify(data[0]));
    }
  }

  Espruino.Core.Relay = {
    init : init,
  };
}());
