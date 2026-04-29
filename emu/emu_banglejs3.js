var PIN_COUNT = 48;
var DEVICE = 21; // USB
var BTN1 = 1;
var BTN2 = 2;
var BTN3 = 3;
var BTN4 = 4;
var GFX_WIDTH = 240;
var GFX_HEIGHT = 240;
var GFX_PAD_WIDTH = 60; // padding for window
var GFX_PAD_HEIGHT = 14;
var FLASH_SIZE = 8192*1024;

function jsGetGfxContents(rgba) {
  var i = 0;
  for (var y=0;y<GFX_HEIGHT;y++) {
    var p = Module.ccall('jsGfxGetPtr', 'number', ['number'], [y]);
    var dy = y-120;
    for (var x=0;x<GFX_WIDTH;x++) {
      var bit = x*6, byte = bit>>3;
      var c = p ? (Module.HEAPU8[p+byte]|(Module.HEAPU8[p+byte+1]<<8)) : 0;
      var dx = x-120;
      var d = dx*dx+dy*dy;
      c = c >> (bit&7);
      let cb = c&3, cg = (c>>2)&3, cr = (c>>4)&3;
      rgba[i++]=(cr<<6)|(cr<<4)|(cr<<2)|cr;
      rgba[i++]=(cg<<6)|(cg<<4)|(cg<<2)|cg;
      rgba[i++]=(cb<<6)|(cb<<4)|(cb<<2)|cb;
      rgba[i++]=(d > 14400) ? 96 : 255; // show area offscreen (it's a circle) using transparency
    }
  }
}
