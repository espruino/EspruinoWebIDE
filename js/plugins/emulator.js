/*
Gordon Williams (gw@pur3.co.uk)

If we're running in an iframe, this gets enabled and allows the IDE
to work by passing messages using window.postMessage.

Use embed.js on the client side to link this in.
*/

var DEVICE = 20; // USB
var jsRXCallback;
var jsIdleInterval;
function jsHandleIO() {
  var device;
  var l = "";
  do {
    device = Module.ccall('jshGetDeviceToTransmit', 'number', [], []);
    if (device) {
      var ch = Module.ccall('jshGetCharToTransmit', 'number', ['number'], [device]);
      if (jsRXCallback) jsRXCallback(ch);
      l += String.fromCharCode(ch);
      var ll = l.split("\n");
      if (ll.length>1) {
        console.log("EMSCRIPTEN:",ll[0]);
        l = ll[1];
      }
    }
  } while (device);
}
function jsTransmitChar(c) {
  //console.log("TX -> ",c);
  Module.ccall('jshPushIOCharEvent', 'number', ['number','number'], [DEVICE,c]);
  jsIdle();
}
function jsIdle() {
  var msToNext = Module.ccall('jsIdle', 'number', [], []);
  // msToNext seems broken...
  jsHandleIO();
  jsUpdateGfx();
}
function jsUpdateGfx() {
  var changed = true;//Module.ccall('jsGfxChanged', 'number', [], []);
  if (changed) {
    var p = Module.ccall('jsGfxGetPtr', 'number', [], [])>>1;
    var canvas = document.getElementById('gfxcanvas');
    var ctx = canvas.getContext('2d');
    var imgData = ctx.createImageData(240, 240);
    var rgba = imgData.data;
    for (var i=0;i<240*240;i++) {
      var c = Module.HEAP16[p+i];
      rgba[i*4+0]=(c>>8)&0xF8;
      rgba[i*4+1]=(c>>3)&0xFC;
      rgba[i*4+2]=(c<<3)&0xF8;
      rgba[i*4+3]=255;
    }
    ctx.putImageData(imgData, 0, 0);

  }
  jsHandleIO();
}
function jsInit() {
  var div = document.createElement("div");
  div.style = "position:absolute;top:0px;right:0px;z-index:100;border: 2px solid white;";
  div.innerHTML = `<canvas id="gfxcanvas" width="240" height="240">`;
  var terminal = document.getElementsByClassName("editor__canvas__terminal")[0];
  terminal.appendChild(div);

  Module.ccall('jsInit', 'number', [], []);
  jsHandleIO();
}

(function() {
  var callbacks = {};
  var device = {
    "name" : "Emulator",
    "init" : function() {
    },
    "getPorts": function(callback) {
      callback([{path:'Emulator',description:'Emulator', type:"emulator", autoconnect : true}], true/*instantPorts*/);
    },
    "open": function(path, openCallback, receiveCallback, disconnectCallback) {
      jsRXCallback = function(c) {
        var a = new Uint8Array([c]);
        receiveCallback(a.buffer);
      }
      callbacks.disconnected = disconnectCallback;
      setTimeout(function() {
        jsInit();
        jsIdleInterval = setInterval(jsIdle,100);
        openCallback("Hello");
      },500);
    },
    "write": function(d, callback) {
      for (var i=0;i<d.length;i++) {
        jsTransmitChar(d.charCodeAt(i));
      }
      setTimeout(callback,10);
    },
    "close": function() {
      if (jsIdleInterval) {
        clearInterval(jsIdleInterval);
        jsIdleInterval = undefined;
      }
      callbacks.disconnected();
    },
  };
  Espruino.Core.Serial.devices.push(device);
})();
