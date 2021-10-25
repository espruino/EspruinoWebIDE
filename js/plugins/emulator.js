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
      emulatorWin : "innerWidth=290,innerHeight=268,location=0",
      width : 240,
      height : 240,
    }, {
      id : "BANGLEJS2",
      name : "Bangle.js 2",
      description : '176x176 3 bit, 1 button, full touchscreen',
      link : "https://www.espruino.com/Bangle.js2",
      emulatorURL : "/emu/emu_banglejs2.html",
      emulatorWin : "innerWidth=290,innerHeight=268,location=0",
      width : 176,
      height : 176,
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

  function openEmulator(device) {
    var url = window.location.pathname;
    if (url.includes("/"))
      url = url.substr(0, url.lastIndexOf("/"));
    url = window.location.origin + url + device.emulatorURL;
    if (Espruino.Config.EMULATOR_BANGLEJS_WINDOW === 'inside') {
      try {
        $('.emulator-window').remove();
        var emulatorWindow = $('<div class="emulator-window"><div>EMULATOR</div><iframe src=""></iframe></div>').appendTo('body');
        if (emulatorWindow) {
          var title = $('.emulator-window > div');
          var emulatorIFrame = $('.emulator-window > iframe');
          if (title && emulatorIFrame) {
            var w = device.width + 40;
            var h = device.height + 14 + 30 + 3;
            title.text(device.name);
            emulatorWindow.draggable({
              containment: 'window',
              opacity: 0.35,
              handle: 'div',
            });
            // emulatorWindow.resizable({
            //   handles: 'e, s',
            //   minWidth: w,
            //   minHeight: h,
            //   aspectRatio: true
            // });
            title.css({
              height: '30px',
              padding: '0 10px',
              lineHeight: '30px',
              fontSize: '18px',
              cursor: 'default',
            });
            emulatorWindow.css({
              position: 'absolute',
              top: '10px',
              left: '316px',
              width: w + 'px',
              height: h + 'px',
              backgroundColor: '#fff',
              zIndex: '5',
            });
            emulatorIFrame.css({
              width: '100%',
              height: 'calc(100% - 30px)',
              border: '0 none',
            });
            var close = () => {
              $('.emulator-window').remove();
            }
            emulatorIFrame.load(() => {
              emulatorIFrame[0].contentWindow.close = close;
              post({ type: "init" });
            });
            emulatorIFrame.attr('src', url);
            return emulatorIFrame[0].contentWindow;
          }
        }
      } catch (err) {
        console.log('ERROR', err);
      }
    }
    var emu = window.open(url, "banglewindow", device.emulatorWin);
    if (emu.addEventListener) {
      emu.addEventListener("load", function () {
        post({ type: "init" });
      }, false);
    } else
      if (emu.attachEvent) {
        emu.attachEvent("onload", function () {
          post({ type: "init" });
        }, false);
      }
    return emu;
  }

  var device = {
    "name" : "Emulator",
    "init" : function() {
      Espruino.Core.Config.addSection("Emulator", { sortOrder:350, description: "Settings for Bangle.js emulator" });
      Espruino.Core.Config.add("EMULATOR_BANGLEJS", {
        section : "Emulator",
        name : "Enable Bangle.js Emulator",
        description : "Enable or disable Bangle.js emulator",
        type : "boolean",
        defaultValue : true
      });
      Espruino.Core.Config.add("EMULATOR_BANGLEJS_WINDOW", {
        section : "Emulator",
        name : "Bangle.js Emulator Windows",
        description : "Use a popup window or a internal window to display Bangle.js emulator",
        type : { "outside": "Popup window", "inside": "Internal window" },
        defaultValue : "outside",
        onChange: function () {
          if (emu) {
            emu.close();
            emu = undefined;
          }
        }
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
        emu = openEmulator(device);
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
