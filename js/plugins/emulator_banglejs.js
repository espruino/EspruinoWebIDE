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
      Espruino.Core.Config.add("EMULATOR_BANGLEJS", {
        section : "Communications",
        name : "Enable Bangle.js Emulator",
        description : "The size of font used in the Terminal and Code Editor windows",
        type : "boolean",
        defaultValue : true
      });
    },
    "getStatus": function(ignoreSettings) {
      if (!Espruino.Config.EMULATOR_BANGLEJS && !ignoreSettings)
        return {warning:"Disabled in Communications Settings"};
      return true;
    },
    "getPorts": function(callback) {
      var emulatorRequested = window.location.search.substr(1).split("&").includes("emulator");
      if (emulatorRequested)
        Espruino.Config.set("EMULATOR_BANGLEJS", true);
      if (!Espruino.Config.EMULATOR_BANGLEJS)
        return callback([]);
      var port = {
        path:'Emulator',
        description:'Bangle.js Emulator',
        type:"emulator"};
      if (emulatorRequested)
        port.autoconnect = true;
      callback([port], true/*instantPorts*/);
    },
    "open": function(path, openCallback, receiveCallback, disconnectCallback) {
      callbacks.open = openCallback;
      callbacks.receive = receiveCallback;
      callbacks.disconnected = function() {
        emu = undefined;
        callbacks = {};
        disconnectCallback();
      }
      var url = window.location.pathname;
      if (url.includes("/"))
        url = url.substr(0,url.lastIndexOf("/"));
      url = window.location.origin + url + "/emu_banglejs.html";
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
