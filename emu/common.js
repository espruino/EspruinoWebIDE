// used to interface to Espruino emscripten...
var jsRXCallback;
var jsIdleTimeout;

// Flash memory handling
var flashMemory = new Uint8Array(FLASH_SIZE);
var maxFlashMemory = 0;
flashMemory.fill(255);

if ("undefined" != typeof window) {
  if (window.localStorage) {
    let s = localStorage.getItem("BANGLE_STORAGE");
    if (s!=null) {
      s.split(",").forEach((n,i)=>{
        flashMemory[i] = parseInt(n);
        maxFlashMemory = i;
      });
    }
  }
  window.addEventListener("unload", function() { // Save storage contents on exit
    var a = new Uint8Array(flashMemory.buffer, 0, maxFlashMemory+1);
    localStorage.setItem("BANGLE_STORAGE", a.toString()); // 1,2,3,4, etc...
  });
}
function eraseAll() {
  maxFlashMemory = 0;
  flashMemory.fill(255);
  localStorage.setItem("BANGLE_STORAGE", null);
}

// Pin handling
var hwPinValue = new Uint8Array(PIN_COUNT);
function hwSetPinValue(pin,v) { hwPinValue[pin] = v; }
function hwGetPinValue(pin) { return hwPinValue[pin]; }
function hwFlashWrite(addr,v) { flashMemory[addr] = v; if (addr>maxFlashMemory) maxFlashMemory=addr; }
function hwFlashRead(addr) { return flashMemory[addr]; }

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
        if ("undefined" != typeof onConsoleOutput)
          onConsoleOutput(ll[0]);
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
function jsTransmitString(d) {
  for (var i=0;i<d.length;i++) {
    jsTransmitChar(d.charCodeAt(i));
  }
}
function jsTransmitPinEvent(pin) {
  //console.log("TX -> ",c);
  Module.ccall('jsSendPinWatchEvent', 'number', ['number'], [pin]);
  jsIdle();
}
function jsSendTouchEvent(x,y,pts,gesture) {
  //console.log(x,y,pts,gesture);
  Module.ccall('jsSendTouchEvent', 'number', ['number','number','number','number'], [x,y,pts,gesture]);
  jsIdle();
}
function jsIdle() {
  if (jsIdleTimeout) {
    clearTimeout(jsIdleTimeout);
    jsIdleTimeout = undefined;
  }
  var tries = 5;
  var msToNext = -1;
  while (tries-- && msToNext<0) {
    msToNext = Module.ccall('jsIdle', 'number', [], []);
    jsHandleIO();
  }
  if (msToNext<10) msToNext=10;
  jsIdleTimeout = setTimeout(jsIdle,msToNext);
  jsUpdateGfx();
  return msToNext;
}
function jsStopIdle() {
  if (jsIdleTimeout) {
    clearTimeout(jsIdleTimeout);
    jsIdleTimeout = undefined;
  }
}
function jsInit() {
  if ("undefined" != typeof window) {
    jsInitButtons();

    var borderColors = ['FFF', 'FF0', 'F00', '000', '00F', '0FF'];
    var borderColor = 0
    document.getElementById("border").style.color = '#' + borderColors[(borderColor + 1) % borderColors.length];
    document.getElementById("border").addEventListener('click', e => {
      borderColor = ++borderColor % borderColors.length;
      document.getElementById("gfxcanvas").style.borderColor = '#' + borderColors[borderColor];
      document.getElementById("border").style.color = '#' + borderColors[(borderColor + 1) % borderColors.length];
    });

    document.getElementById("screenshot").addEventListener('click', e => {
      document.getElementById("screenshot").href = document.getElementById("gfxcanvas").toDataURL();
      document.getElementById("screenshot").download = "screenshot.png";
    });
  }

  Module.ccall('jsInit', 'number', [], []);
  jsHandleIO();
}
function jsKill() {
  var d = document.getElementById("gfxdiv");
  if (d) d.remove();
  Module.ccall('jsKill', 'number', [], []);
}
function drawLoadingScreen() {
  var canvas = document.getElementById('gfxcanvas');
  var ctx = canvas.getContext('2d');
  ctx.font = "15px Sans";
  ctx.textAlign = "center";
  ctx.fillStyle = "black";
  ctx.fillText("Loading...", GFX_WIDTH/2, GFX_HEIGHT/2);
}
if ("undefined" != typeof window)
  drawLoadingScreen();

/* ===========================================================================
     Frame to frame comms
   ===========================================================================

HOST sends: {type:"rx",for:"emu",data:string}
            {type:"init",for:"emu"} - set up the backchannel

WE send: {type:"tx",from:"emu",data:string}

*/
if ("undefined" != typeof window) {
  var hostWindow = window.parent;
  window.addEventListener('message', function(e) {
    var event = e.data;
    console.log("EMU MESSAGE ---------------------------------------");
    console.log(JSON.stringify(event,null,2));
    console.log("-----------------------------------------------");
    if (typeof event!="object" || event.for!="emu") return;
    switch (event.type) {
      case "init": {
        console.log("HOST WINDOW CONFIGURED");
        hostWindow = e.source;
        post({type:"init"});
        jsInit();
        jsIdle();
      } break;
      case "rx": {
        var d = event.data;
        if (typeof d!="string")
          console.error("receive event expecting data string");
        jsTransmitString(d);
      } break;
      default:
        console.error("Unknown event type ",event.type);
        break;
    }
  });
  console.log("Waiting for posted {type:init} message");
}

function post(msg) {
  msg.from="emu";
  hostWindow.postMessage(msg,"*");
}

jsRXCallback = function(c) {
  post({type:"tx",data:String.fromCharCode(c)});
}


/* ===========================================================================
     Window resizing code
   =========================================================================== */

var dontTrigger = false;
var timerResize;
var WIN_WIDTH = (GFX_WIDTH+10+30);
var WIN_HEIGHT = (GFX_HEIGHT+10+4);
function resizeEnd() {
  //100ms since last resize
  dontTrigger = true;
  window.resizeBy(Math.round(byX*correctingRatio*WIN_WIDTH-window.innerWidth), Math.round(byY*correctingRatio*WIN_HEIGHT-window.innerHeight));
  var scale = correctingRatio*byX;
  if (scale < correctingRatio ) scale = correctingRatio;
  document.getElementById("gfxdiv").style.transform = "translate(-50%,-50%) scale("+scale+","+scale+")";

}
function onResize(e) {
  if ( !dontTrigger ) {
    clearTimeout(timerResize);
    timerResize = setTimeout(resizeEnd, 100);
  } else {
    dontTrigger = false;
  }

  // data collection
  if ( window.innerWidth < Math.floor(WIN_WIDTH*correctingRatio*3) || window.innerHeight < Math.floor(WIN_HEIGHT*correctingRatio*3) ) {
    if ( window.innerWidth < Math.floor(WIN_WIDTH*correctingRatio*2.5) || window.innerHeight < Math.floor(WIN_HEIGHT*correctingRatio*2.5) ) {
      byX=2;byY=2;
    } else {
      byX=3;byY=3;
    }
  } else {
    byX=3;byY=3;
  }
  if ( window.innerWidth < Math.floor(WIN_WIDTH*correctingRatio*2) || window.innerHeight < Math.floor(WIN_HEIGHT*correctingRatio*2) ) {
    if ( window.innerWidth < Math.floor(WIN_WIDTH*correctingRatio*1.5) || window.innerHeight < Math.floor(WIN_HEIGHT*correctingRatio*1.5) ) {
      byX=1;byY=1;
    } else {
      byX=2;byY=2;
    }
  }
  if ( window.innerWidth < Math.floor(WIN_WIDTH*correctingRatio) || window.innerHeight < Math.floor(WIN_HEIGHT*correctingRatio) ) {
    byX=1;byY=1;
  }
}

if ("undefined" != typeof window) {
  var correctingRatio = 1/window.devicePixelRatio;
  var byX=1,byY=1;
  window.addEventListener('resize', onResize);
  onResize();
}
