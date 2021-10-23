var PIN_COUNT = 32;
var DEVICE = 21; // USB
var BTN1 = 24;
var BTN2 = 22;
var BTN3 = 23;
var BTN4 = 11;
var BTN5 = 16;
var GFX_WIDTH = 240;
var GFX_HEIGHT = 240;
var FLASH_SIZE = 4096*1024;

function jsGetGfxContents(rgba) {
  var i = 0;
  for (var y=0;y<240;y++) {
    var p = Module.ccall('jsGfxGetPtr', 'number', ['number'], [y])>>1;
    for (var x=0;x<240;x++) {
      var c = p ? Module.HEAP16[p+x] : 0;
      rgba[i++]=(c>>8)&0xF8;
      rgba[i++]=(c>>3)&0xFC;
      rgba[i++]=(c<<3)&0xF8;
      rgba[i++]=255;
    }
  }
 }
