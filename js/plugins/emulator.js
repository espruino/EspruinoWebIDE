/**
 Copyright 2026 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Plugin to allow connections to Emulators
 ------------------------------------------------------------------
**/
var emu;
(function() {
  var callbacks = {};

  /* To enable 'beta' emulators, paste this into the console:
  Espruino.Config.set("EMU_BETA", 1);
  */
  function getEmulators() {
    let emulators = [
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
    if (Espruino.Config.EMU_BETA)
      emulators.push({
        id : "BANGLEJS3",
        name : "Bangle.js 3",
        description : '240x240 6 bit, 4 buttons, full touchscreen',
        link : "https://www.espruino.com/Bangle.js3",
        emulatorURL : "/emu/emu_banglejs3.html",
        emulatorWin : "innerWidth=290,innerHeight=268,location=0"
      });
    return emulators;
  }

  function post(msg) {
    if (!emu) return;
    msg.for="emu";
    emu.postMessage(msg,"*");
  }

  window.addEventListener('message', function(e) {
    // emu can be undefined when emu window closed OR refreshed.
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
      contents: Espruino.Core.HTML.domList(getEmulators().map(e=>({
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
        subSection: "Connections",
        name : "Enable Bangle.js Emulator",
        description : "Whether to show the option for Emulators when clicking the Connect button",
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
      chooseDevice(function(emuDevice) {
        if (!emuDevice) {
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
        url = window.location.origin + url + emuDevice.emulatorURL;
        emu = window.open(url, "banglewindow", emuDevice.emulatorWin);
        var inited = false;
        emu.addEventListener("load", function() {
          if (!inited) post({type:"init"});
          inited = true;
        }, false);
        window.addEventListener("unload", function() {
          // Ensure emulator window closes on page refresh, so that can be re-init.
          // Not fail-proof if emu windows was manual refreshed, as cant' post and emu window reference changes.
          // So: Emu window will close its-self if window.opener.emu is undefined.
          device.close()
        });
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
