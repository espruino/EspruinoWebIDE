/*
Gordon Williams (gw@pur3.co.uk)

If we're running in an iframe, this gets enabled and allows the IDE
to work by passing messages using window.postMessage.

Use embed.js on the client side to link this in.
*/

  var emu;

(function() {
  var callbacks = {};

  var EMULATORS = [
    {
      id : "BANGLEJS2",
      name : "Bangle.js 1",
      description : '240x240 16 bit, 3 buttons',
      link : "https://www.espruino.com/Bangle.js",
      emulatorURL : "/emu/emu_banglejs1.html",
      emulatorWin : "innerWidth=290,innerHeight=268,location=0"
    }, {
      id : "BANGLEJS2",
      name : "Bangle.js 2",
      description : '176x176 3 bit, 1 button, full touchscreen',
      link : "https://www.espruino.com/Bangle.js2",
      emulatorURL : "/emu/emu_banglejs2.html",
      emulatorWin : "innerWidth=290,innerHeight=268,location=0"
    }
  ];

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

  function chooseDevice(callback) {
    var selected = false;
    var popup = Espruino.Core.App.openPopup({
      id: "sendmethod",
      title: "Upload Destination",
      padding: true,
      contents: Espruino.Core.HTML.domList(EMULATORS.map(e=>({
        title: e.name,
        description : e.description,//+`<a href="${e.link}" target="_blank">more info</a>`,
        callback : function() {
          selected=true;
          popup.close();
          callback(e);
        }
      }))),
      position: "auto",
      onClose: () => {
        if (!selected) callback(undefined);
      }
    });
  }

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
      chooseDevice(function(device) {
        if (!device) {
          openCallback(null); // flag error
          return;
        }
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
        url = window.location.origin + url + device.emulatorURL;
        emu = window.open(url, "banglewindow", device.emulatorWin);
        var inited = false;
        emu.addEventListener("load", function() {
          if (!inited) post({type:"init"});
          inited = true;
        }, false);
        emu.attachEvent("onload", function() {
          if (!inited) post({type:"init"});
          inited = true;
        }, false);
      });
    },
    "write": function(d, callback) {
      post({type:"rx",data:d});
      setTimeout(callback,10);
    },
    "close": function() {
      if (emu) emu.close();
      //callbacks.disconnected(); // called by emu.onunload
      emu = undefined;
    },
  };
  Espruino.Core.Serial.devices.push(device);
})();
