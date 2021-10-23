var PIN_COUNT = 48;
var DEVICE = 21; // USB
var BTN1 = 17;
var GFX_WIDTH = 176;
var GFX_HEIGHT = 176;
var FLASH_SIZE = 8192*1024;

function jsGetGfxContents(rgba) {
  var i = 0;
  for (var y=0;y<176;y++) {
    var p = Module.ccall('jsGfxGetPtr', 'number', ['number'], [y]);
    for (var x=0;x<176;x++) {
      var bit = x*3, byte = bit>>3;
      var c = p ? (Module.HEAPU8[p+byte+1]|(Module.HEAPU8[p+byte]<<8)) : 0;
      c = c >> (13-(bit&7));
      rgba[i++]=(c&4)?0xFF:0;
      rgba[i++]=(c&2)?0xFF:0;
      rgba[i++]=(c&1)?0xFF:0;
      rgba[i++]=255;
    }
  }
}
