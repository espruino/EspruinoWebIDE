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
  var emuFrame; // iframe element if emulator is shown inside the IDE

  /* To enable 'beta' emulators, paste this into the console:
  Espruino.Config.set("EMU_BETA", 1);
  */
  function getEmulators() {
    let emulators = [
      {
        id : "BANGLEJS",
        name : "Bangle.js 1",
        description : '240x240 16 bit, 3 buttons',
        link : "https://www.espruino.com/Bangle.js",
        emulatorURL : "/emu/emu_banglejs1.html",
        emulatorWin : "innerWidth=290,innerHeight=268,location=0",
        frameWidth : 280, frameHeight : 260
      }, {
        id : "BANGLEJS2",
        name : "Bangle.js 2",
        description : '176x176 3 bit, 1 button, full touchscreen',
        link : "https://www.espruino.com/Bangle.js2",
        emulatorURL : "/emu/emu_banglejs2.html",
        emulatorWin : "innerWidth=290,innerHeight=268,location=0",
        frameWidth : 216, frameHeight : 196
      }
    ];
    if (Espruino.Config.EMU_BETA)
      emulators.push({
        id : "BANGLEJS3",
        name : "Bangle.js 3",
        description : '240x240 6 bit, 4 buttons, full touchscreen',
        link : "https://www.espruino.com/Bangle.js3",
        emulatorURL : "/emu/emu_banglejs3.html",
        emulatorWin : "innerWidth=290,innerHeight=268,location=0",
        frameWidth : 300, frameHeight : 260
      });
    emulators.forEach(e => e.path = e.name+" Emulator");
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
        if (!emuFrame) { // for iframes, we handle disconnection in removeFrame
          emu.addEventListener('unload', function(e) {
            console.log("EMU frame closed");
            if (callbacks.disconnected) callbacks.disconnected();
            callbacks = {};
          });
        }
        if (callbacks.open) callbacks.open("success");
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
      title: "Choose Emulator",
      padding: true,
      contents: Espruino.Core.HTML.domList(getEmulators().map(e=>({
        title: e.name,
        description : e.description,//+`<a href="${e.link}" target="_blank">more info</a>`,
        callback : function() {
          selected = true;
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

  /// Create an iframe containing the emulator in the top right of the terminal, return its window
  function openFrame(url, emuDevice, onLoad) {
    if (emuFrame) { // remove any stale frame (without calling the new connection's callbacks)
      emuFrame.wrapper.remove();
      emuFrame = undefined;
    }
    var container = document.querySelector(".editor--terminal .editor__canvas");
    if (!container) return undefined;
    // Wrapper with a title bar that can be used to drag the emulator around
    var wrapper = document.createElement("div");
    wrapper.className = "emulator__window";
    wrapper.style.cssText = "position:absolute;top:8px;right:24px;z-index:10;border:1px solid #888;border-radius:4px;background:#ccc;box-shadow:0 2px 8px rgba(0,0,0,0.5);overflow:hidden;";
    var titleBar = document.createElement("div");
    titleBar.className = "emulator__titlebar";
    titleBar.textContent = emuDevice.name+" Emulator";
    titleBar.title = "Drag to move";
    titleBar.style.cssText = "height:18px;line-height:18px;padding:0 6px;font-size:11px;font-family:sans-serif;color:#eee;background:#555;cursor:move;user-select:none;-webkit-user-select:none;touch-action:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
    emuFrame = document.createElement("iframe");
    emuFrame.title = emuDevice.name+" Emulator";
    emuFrame.style.cssText = "display:block;border:0;background:white;"+
      "width:"+(emuDevice.frameWidth||290)+"px;height:"+(emuDevice.frameHeight||268)+"px;";
    emuFrame.wrapper = wrapper;
    emuFrame.addEventListener("load", onLoad, false);
    emuFrame.src = url;
    wrapper.appendChild(titleBar);
    wrapper.appendChild(emuFrame);
    container.appendChild(wrapper);
    makeDraggable(wrapper, titleBar, container);
    return emuFrame.contentWindow;
  }

  /// Allow 'wrapper' to be dragged around inside 'container' using 'handle'
  function makeDraggable(wrapper, handle, container) {
    var drag; // {dx,dy} offset of pointer from wrapper's top left while dragging
    function clamp(x, y) { // keep the window within the container
      var maxX = Math.max(0, container.clientWidth - wrapper.offsetWidth);
      var maxY = Math.max(0, container.clientHeight - wrapper.offsetHeight);
      wrapper.style.left = Math.round(Math.min(Math.max(x, 0), maxX))+"px";
      wrapper.style.top = Math.round(Math.min(Math.max(y, 0), maxY))+"px";
      wrapper.style.right = "auto";
    }
    handle.addEventListener("pointerdown", function(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      drag = { dx : e.clientX - wrapper.offsetLeft, dy : e.clientY - wrapper.offsetTop };
      handle.setPointerCapture(e.pointerId);
      emuFrame.style.pointerEvents = "none"; // don't let the iframe steal events mid-drag
    });
    handle.addEventListener("pointermove", function(e) {
      if (!drag) return;
      clamp(e.clientX - drag.dx, e.clientY - drag.dy);
    });
    function endDrag(e) {
      if (!drag) return;
      drag = undefined;
      if (emuFrame) emuFrame.style.pointerEvents = "";
      if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
    }
    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);
    // if the terminal is resized, keep the emulator inside it (once it has been moved)
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function() {
        if (!wrapper.isConnected) return ro.disconnect();
        if (wrapper.style.right == "auto") clamp(wrapper.offsetLeft, wrapper.offsetTop);
      });
      ro.observe(container);
    }
  }

  /// Remove the emulator iframe if it exists
  function removeFrame() {
    if (!emuFrame) return;
    var frame = emuFrame;
    emuFrame = undefined;
    frame.wrapper.remove();
    if (callbacks.disconnected) callbacks.disconnected();
    callbacks = {};
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
      Espruino.Core.Config.add("EMULATOR_IFRAME", {
        section : "Communications",
        subSection: "Connections",
        name : "Show Emulator inside the IDE",
        description : "If checked, the Emulator is shown in the top right of the Terminal rather than in a separate popup window. The Emulator will be shown inside the IDE anyway if a popup window can't be opened.",
        type : "boolean",
        defaultValue : false
      });
    },
    "getStatus": function(ignoreSettings) {
      if (!Espruino.Config.EMULATOR_BANGLEJS && !ignoreSettings)
        return {warning:"Disabled in Communications Settings"};
      return true;
    },
    "getPorts": function(callback, options) {
      options = options||{};
      var noEmulatorRequested = window.location.search.substr(1).split("&").includes("noemulator");
      if (noEmulatorRequested)
        return callback([]);
      var emulatorRequested = window.location.search.substr(1).split("&").includes("emulator");
      if (emulatorRequested)
        Espruino.Config.set("EMULATOR_BANGLEJS", true);
      if (!Espruino.Config.EMULATOR_BANGLEJS)
        return callback([]);
      var ports = [{
        path:'Emulator',
        description:'Bangle.js Emulator',
        type:"emulator"}];
      if (options.flatten) { // if set, include all emulators
        ports = getEmulators().map(e=>({
          path:e.path,
          description:e.description,
          type:"emulator"
        }));
      }
      if (emulatorRequested)
        ports.forEach(p => p.autoconnect = true);
      callback(ports, true/*instantPorts*/);
    },
    "open": function(path, openCallback, receiveCallback, disconnectCallback) {
      function open(emuDevice) {
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
        var inited = false;
        function onLoad() {
          if (!inited) post({type:"init"});
          inited = true;
        }
        emu = undefined;
        if (!Espruino.Config.EMULATOR_IFRAME) {
          try {
            emu = window.open(url, "banglewindow", emuDevice.emulatorWin);
          } catch (e) {
            console.warn("EMU popup failed", e);
            emu = undefined;
          }
          if (emu) emu.addEventListener("load", onLoad, false);
          else console.log("EMU popup couldn't be opened - using iframe instead");
        }
        if (!emu) { // open in an iframe in the top right of the terminal
          emu = openFrame(url, emuDevice, onLoad);
          if (!emu) {
            callbacks = {};
            openCallback(null); // flag error
            return;
          }
        }
        window.addEventListener("unload", function() {
          // Ensure emulator window closes on page refresh, so that can be re-init.
          // Not fail-proof if emu windows was manual refreshed, as cant' post and emu window reference changes.
          // So: Emu window will close its-self if window.opener.emu is undefined.
          device.close()
        });
      };
      var emuDevice = getEmulators().find(e => e.path == path);
      if (emuDevice) open(emuDevice);
      else chooseDevice(open);
    },
    "write": function(d, callback) {
      post({type:"rx",data:d});
      setTimeout(callback,10);
    },
    "close": function() {
      if (emuFrame) removeFrame();
      else if (emu) emu.close();
      //callbacks.disconnected(); // called by emu.onunload
      emu = undefined;
    },
  };
  Espruino.Core.Serial.devices.push(device);
})();
