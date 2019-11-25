/*
Gordon Williams (gw@pur3.co.uk)

If we're running in an iframe, this gets enabled and allows the IDE
to work by passing messages using window.postMessage.

Use embed.js on the client side to link this in.
*/

var DEVICE = 20; // USB
var BTN1 = 24;
var BTN2 = 22;
var BTN3 = 23;
var BTN4 = 11;
var BTN5 = 16;
var jsRXCallback;
var jsIdleInterval;
// used to interface to Espruino emscripten...
var hwPinValue = new Uint8Array(32);
function hwSetPinValue(pin,v) { hwPinValue[pin] = v; }
function hwGetPinValue(pin) { return hwPinValue[pin]; }

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
function jsTransmitPinEvent(pin) {
  //console.log("TX -> ",c);
  Module.ccall('jsSendPinWatchEvent', 'number', ['number'], [pin]);
  jsIdle();
}
function jsIdle() {
  var msToNext = Module.ccall('jsIdle', 'number', [], []);
  // msToNext seems broken...
  jsHandleIO();
  jsUpdateGfx();
}
function jsUpdateGfx() {
  var changed = Module.ccall('jsGfxChanged', 'number', [], []);
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
  div.id = "gfxdiv";
  div.style = "position:absolute;top:0px;right:0px;z-index:100;border: 2px solid white;width:264px;height:244px;";
  div.style = "position:absolute;top:0px;right:0px;z-index:100;border: 2px solid white;width:264px;height:244px;";
  div.innerHTML = `<canvas id="gfxcanvas" width="240" height="240"></canvas>
<button id="BTN1" style="width:20px;height:80px;position:absolute;right:0px;top:0px;">1</button>
<button id="BTN2" style="width:20px;height:80px;position:absolute;right:0px;top:80px;">2</button>
<button id="BTN3" style="width:20px;height:80px;position:absolute;right:0px;top:160px;">3</button>
<div id="BTN4" style="width:120px;height:240px;position:absolute;left:0px;top:0px;">
<div id="BTN5" style="width:120px;height:240px;position:absolute;left:120px;top:0px;">`;
  var terminal = document.getElementsByClassName("editor__canvas__terminal")[0];
  terminal.appendChild(div);
  function handleButton(n, pin) {
    hwPinValue[pin]=1; // inverted
    var btn = document.getElementById("BTN"+n);
    btn.addEventListener('mousedown', e => {
      hwPinValue[pin]=0; // inverted
      jsTransmitPinEvent(pin);
    });
    btn.addEventListener('mouseup', e => {
      hwPinValue[pin]=1; // inverted
      jsTransmitPinEvent(pin);
    });
  }
  handleButton(1,BTN1);
  handleButton(2,BTN2);
  handleButton(3,BTN3);
  handleButton(4,BTN4);
  handleButton(5,BTN5);

  Module.ccall('jsInit', 'number', [], []);
  jsHandleIO();
}
function jsKill() {
  var d = document.getElementById("gfxdiv");
  if (d) d.remove();
  Module.ccall('jsKill', 'number', [], []);
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
      jsKill();
      callbacks.disconnected();
    },
  };
  Espruino.Core.Serial.devices.push(device);
})();
