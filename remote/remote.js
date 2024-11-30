var portList;
/// webtrc instance when initialised
var webrtc;
/// If not true, the connection was requested from the top-left and we should just disconnect
var connectionRequested = false;

// THIS IS NEVER SHOWN AT THE MOMENT
  Espruino.Core.Terminal.OVERRIDE_CONTENTS = `
  <div style="max-width:400px;margin:auto;">
  <b>Loading...</b>
  </div>
  `;
// ABOUT page
  Espruino.Core.Config.addSection("About", {
    description : undefined,
    sortOrder : -1000,
    getHTML : function(callback) {
      callback(`<h2>Web IDE Remote Connection Bridge</h2>
<p>
This Remote Connection Bridge exists so that you can connect
the Web IDE to your Espruino devices even if you do not have
direct access to them or your main PC doesn't have the required
communications (for instance Bluetooth).
</p>
<p>
To use this, go to <a href="https://www.espruino.com/ide/" target="_blank">https://www.espruino.com/ide/</a>
on the computer you want to run the IDE on, click the connect button in the top left,
and then click <b>🌐 Remote Connection</b> at the bottom left of the <b>Select a Port</b> window.
You can then scan the QR code (or copy the link) onto the device (probably an Android phone)
that you want to use as the Bridge.
</p>
${(webrtc && webrtc.peerId)?`
<p>
If you want to connect to this instance of the Bridge, copy the following code
and paste it into the <b>Remote Connection Bridge Peer ID</b> field in your
Web IDE's settings:
</p><p style="text-align:center;"><b>${webrtc.peerId}</b></p>`:``}`);
    }
  });

  Espruino.Config.set("SHOW_WEBCAM_ICON", 1); // force webcam icon

  // ---------------------------
  function print(txt) {
    console.log(txt);
    Espruino.Core.Terminal.outputDataHandler(txt+"\r\n");
  }
  function getUID() {
    var s = "";
    for (var i=0;i<8;i++)
      s+=(0|(Math.random()*36)).toString(36).substr(-1);
    return s;
  }
  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }
  // ---------------------------



  webrtc = webrtcInit({
    bridge:true,
    onStatus : function(s) {
      print(s);
    },
    onPeerID : function(s) {
      print("==========================================");
      print(" Bridge's Peer ID:");
      print("     "+s);
      print("==========================================");
      // Have we been asked to connect to an IDE?
      var clientPeerId = null;
      if (window.location.search && window.location.search[0]=="?") {
        window.location.search.substr(1).split("&").forEach(kv => {
          kv = kv.split("=");
          if (kv[0]=="id")
          clientPeerId = kv[1];
        });
      }
      if (clientPeerId)
        webrtc.connectSendPeerId(clientPeerId);
    },
    onGetPorts : function(cb) {
      Espruino.Core.Serial.getPorts(ports => {
        // Don't show "Web Bluetooth"/etc
        portList = ports.filter(p => !p.promptsUser);
        // set type to socket so they have a different web-like icon
        portList.forEach(p => p.type="socket");
        // respond
        cb(portList);
      });
    },
    onPeerDisconnected : function() {
      // peer disconnected - drop connection
      if (Espruino.Core.Serial.isConnected())
        Espruino.Core.Serial.close();
    },
    onPortConnect : function(serialPort, cb) {
      if (Espruino.Core.Serial.isConnected())
        Espruino.Core.Serial.close();
      print("Connecting to "+serialPort);
      connectionRequested = true;
      Espruino.Core.Serial.open(serialPort, function(cInfo) {
        // Ensure that data from Espruino goes here
        Espruino.Core.Serial.startListening(function(data) {
          data = ab2str(data);
          console.log("remote.js -> "+JSON.stringify(data));
          webrtc.onPortReceived(data);
        });
        Espruino.Core.Serial.setSlowWrite(false, true/*force*/);
        if (cInfo!=undefined) {
          console.log("Device found (connectionId="+ cInfo.connectionId +")");
          Espruino.Core.Notifications.success("Connected to "+serialPort, true);
          print("Connected to "+serialPort);
        } else {
          // fail
          Espruino.Core.Notifications.error("Connection Failed.", true);
          print("Connection Failed.");
        }
        cb();
      }, function () {
        console.log("Disconnect callback...");
        print("Bluetooth connection closed");
        Espruino.Core.Notifications.warning("Disconnected", true);
        // TODO: report disconnected
      });
    },
    onPortDisconnect : function(serialPort) {
      Espruino.Core.Serial.close();
    },
    onPortWrite : function(data, cb) {
      console.log("remote.js write "+JSON.stringify(data));
      Espruino.Core.Serial.write(data, false, function() {
        console.log("remote.js written");
        cb();
      });
    }
  });



  function showAvailableDevices() {
    Espruino.Core.Serial.getPorts(ports => {
      ports = ports.filter(p => !p.promptsUser);
      if (ports.length)
        print("The following devices are paired:\n  "+ports.map(p=>p.path).join("\n  "));
      else
        print("No devices are paired");
      print("To add more devices please click the connect icon in the top left.");
    });
  }

  function init() {
    Espruino.Config.set("FONT_SIZE", 18);

    $("#terminal").css("font-size", Espruino.Config.FONT_SIZE+"px");

    print("Web IDE Remote Connection Bridge");

    //Espruino.Core.Terminal.addNotification('<img src="../img/ide_logo.png" onclick="Espruino.Core.MenuSettings.show()"><br/>',{noBorder:true});

    Espruino.addProcessor("connected", function(data, callback) {
      /* If the connection was initiated from the button in the top left
      then we disconnect immediately and show what devices we know about. */
      if (!connectionRequested) {
        setTimeout(function() {
          if (Espruino.Core.Serial.isConnected())
            Espruino.Core.Serial.close();
          showAvailableDevices();
        }, 500);
      }
      connectionRequested = false;
      callback(data);
    });

    Espruino.addProcessor("disconnected", function(data, callback) {
      webrtc.onPortDisconnected();
      callback(data);
    });

    Espruino.addProcessor("webcam", function(data, callback) {
      if (data.visible && webrtc) {
        webrtc.connectVideo(data.stream);
      }

      callback(data);
    });

    setTimeout(() => {
      // disable terminal
      Espruino.Core.Terminal.setInputDataHandler(function(d) { });
      showAvailableDevices();
    }, 500);
  }


  function startWebSocket() {
    console.log("Disabling normal terminal");



    console.log("Starting Websocket connection");
    print("Starting Websocket connection");
    // Create WebSocket connection.

    socket.addEventListener('open', function (event) {
      Espruino.Core.Notifications.success("Websocket connection open", true);

      socket.send('\x10'+Espruino.Config.RELAY_KEY);
    });
    socket.addEventListener('close', function (event) {
      socket = undefined;
      Espruino.Core.Notifications.warning("Websocket connection closed", true);
      print("Websocket connection closed");
      Espruino.Core.Serial.close();
    });
    // Listen for messages
    socket.addEventListener('message', function (event) {
      socketToBLE(event.data);
    });



    function socketToBLE(data) {
      if (data[0]=="\x01") {
        console.log("BLE <- "+JSON.stringify(data.substr(1)));
        // Data to send

      } else if (data[0]=="\x20") {
        print("New client connected");
      } else print("Unknown packet type "+JSON.stringify(data[0]));
    }
  }

  Espruino.Core.Remote = {
    init : init,
  };
//}());
