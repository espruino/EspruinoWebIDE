
// THIS IS NEVER SHOWN AT THE MOMENT
  Espruino.Core.Terminal.OVERRIDE_CONTENTS = `
  <div style="max-width:400px;margin:auto;">
  <h1>Espruino Remote</h1>
  <p>This allows you to forward the Bluetooth or Serial connection from one device to a Web IDE on a desktop computer</p>
  <h2>How to use</h2>
  <ul>
  <li>Click the 'Connect' icon in the top left</li>
  <li>Choose a Web Bluetooth device and click 'Pair'</li>
  <li>You can now use your device from the Web IDE</li>
  </ul>
  </div>
  `;

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

  var portList;
  /// webtrc instance when initialised
  var webrtc; 

  webrtc = webrtcInit({
    bridge:true, 
    onStatus : function(s) {
      print(s);
    },
    onPeerID : function(s) {
      print("Our peer ID:"+s);
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
        portList = ports.filter(p => !p.promptsUser);
        cb(portList);
      });
    },
    onPortConnect : function(serialPort, cb) {
      print("Connecting to "+serialPort);          
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

    Espruino.addProcessor("connected", function(data, callback) {
      console.log("----> Connected");
      callback(data);      
    });

    Espruino.addProcessor("disconnected", function(data, callback) {
      console.log("----> Disconnected");
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
