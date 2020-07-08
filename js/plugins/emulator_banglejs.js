/*
Gordon Williams (gw@pur3.co.uk)

If we're running in an iframe, this gets enabled and allows the IDE
to work by passing messages using window.postMessage.

Use embed.js on the client side to link this in.
*/

  var emu;

(function() {
  var callbacks = {};

  function post(msg) {
    if (!emu) return;
    msg.for="emu";
    emu.postMessage(msg,"*");
  }

  window.addEventListener('message', function(e) {
    if (!emu) return;
    var event = e.data;
    //if (typeof event!="object" || event.from!="emu") return;
    console.log("EMU HOST MESSAGE", event);
    switch (event.type) {
      case "init":
        console.log("EMU frame initialised");
        emu.addEventListener('unload', function(e) {
          console.log("EMU frame closed");
          callbacks.disconnected();
          callbacks = {};
        });
        callbacks.open("success");
        break;
      case "tx": {
        var d = event.data;
        var a = new Uint8Array(d.length);
        for (var i=0;i<d.length;i++) a[i]=d.charCodeAt(i);
        callbacks.receive(a.buffer);
        break;
      }
    }
  });

  var device = {
    "name" : "Emulator",
    "init" : function() {
    },
    "getPorts": function(callback) {
      callback([{path:'Emulator',description:'Bangle.js Emulator', type:"emulator"/*, autoconnect : true*/}], true/*instantPorts*/);
    },
    "open": function(path, openCallback, receiveCallback, disconnectCallback) {
      callbacks.open = openCallback;
      callbacks.receive = receiveCallback;
      callbacks.disconnected = function() {
        emu = undefined;
        callbacks = {};
        disconnectCallback();
      }
      var url = "https://localhost/EspruinoWebIDE/emu_banglejs.html";
      emu = window.open(url, "banglewindow", "innerWidth=270,innerHeight=248,location=0");
      setTimeout(function() {
        post({type:"init"});
      }, 500);

    },
    "write": function(d, callback) {
      post({type:"rx",data:d});
      setTimeout(callback,10);
    },
    "close": function() {
      emu.close();
      //callbacks.disconnected(); // called by emu.onunload
      emu = undefined;
    },
  };
  Espruino.Core.Serial.devices.push(device);
})();
