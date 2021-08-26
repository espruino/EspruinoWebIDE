/* Copyright 2020 Gordon Williams, gw@pur3.co.uk
   https://github.com/espruino/EspruinoWebTools
*/
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['b'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('b'));
    } else {
        // Browser globals (root is window)
        root.imageconverter = factory(root.heatshrink);
    }
}(typeof self !== 'undefined' ? self : this, function (heatshrink) {

  const PALETTE = {
   VGA: [0x000000, 0x0000a8, 0x00a800, 0x00a8a8, 0xa80000, 0xa800a8, 0xa85400, 0xa8a8a8, 0x545454, 0x5454fc, 0x54fc54, 0x54fcfc, 0xfc5454, 0xfc54fc, 0xfcfc54, 0xfcfcfc, 0x000000, 0x141414, 0x202020, 0x2c2c2c, 0x383838, 0x444444, 0x505050, 0x606060, 0x707070, 0x808080, 0x909090, 0xa0a0a0, 0xb4b4b4, 0xc8c8c8, 0xe0e0e0, 0xfcfcfc, 0x0000fc, 0x4000fc, 0x7c00fc, 0xbc00fc, 0xfc00fc, 0xfc00bc, 0xfc007c, 0xfc0040, 0xfc0000, 0xfc4000, 0xfc7c00, 0xfcbc00, 0xfcfc00, 0xbcfc00, 0x7cfc00, 0x40fc00, 0x00fc00, 0x00fc40, 0x00fc7c, 0x00fcbc, 0x00fcfc, 0x00bcfc, 0x007cfc, 0x0040fc, 0x7c7cfc, 0x9c7cfc, 0xbc7cfc, 0xdc7cfc, 0xfc7cfc, 0xfc7cdc, 0xfc7cbc, 0xfc7c9c, 0xfc7c7c, 0xfc9c7c, 0xfcbc7c, 0xfcdc7c, 0xfcfc7c, 0xdcfc7c, 0xbcfc7c, 0x9cfc7c, 0x7cfc7c, 0x7cfc9c, 0x7cfcbc, 0x7cfcdc, 0x7cfcfc, 0x7cdcfc, 0x7cbcfc, 0x7c9cfc, 0xb4b4fc, 0xc4b4fc, 0xd8b4fc, 0xe8b4fc, 0xfcb4fc, 0xfcb4e8, 0xfcb4d8, 0xfcb4c4, 0xfcb4b4, 0xfcc4b4, 0xfcd8b4, 0xfce8b4, 0xfcfcb4, 0xe8fcb4, 0xd8fcb4, 0xc4fcb4, 0xb4fcb4, 0xb4fcc4, 0xb4fcd8, 0xb4fce8, 0xb4fcfc, 0xb4e8fc, 0xb4d8fc, 0xb4c4fc, 0x000070, 0x1c0070, 0x380070, 0x540070, 0x700070, 0x700054, 0x700038, 0x70001c, 0x700000, 0x701c00, 0x703800, 0x705400, 0x707000, 0x547000, 0x387000, 0x1c7000, 0x007000, 0x00701c, 0x007038, 0x007054, 0x007070, 0x005470, 0x003870, 0x001c70, 0x383870, 0x443870, 0x543870, 0x603870, 0x703870, 0x703860, 0x703854, 0x703844, 0x703838, 0x704438, 0x705438, 0x706038, 0x707038, 0x607038, 0x547038, 0x447038, 0x387038, 0x387044, 0x387054, 0x387060, 0x387070, 0x386070, 0x385470, 0x384470, 0x505070, 0x585070, 0x605070, 0x685070, 0x705070, 0x705068, 0x705060, 0x705058, 0x705050, 0x705850, 0x706050, 0x706850, 0x707050, 0x687050, 0x607050, 0x587050, 0x507050, 0x507058, 0x507060, 0x507068, 0x507070, 0x506870, 0x506070, 0x505870, 0x000040, 0x100040, 0x200040, 0x300040, 0x400040, 0x400030, 0x400020, 0x400010, 0x400000, 0x401000, 0x402000, 0x403000, 0x404000, 0x304000, 0x204000, 0x104000, 0x004000, 0x004010, 0x004020, 0x004030, 0x004040, 0x003040, 0x002040, 0x001040, 0x202040, 0x282040, 0x302040, 0x382040, 0x402040, 0x402038, 0x402030, 0x402028, 0x402020, 0x402820, 0x403020, 0x403820, 0x404020, 0x384020, 0x304020, 0x284020, 0x204020, 0x204028, 0x204030, 0x204038, 0x204040, 0x203840, 0x203040, 0x202840, 0x2c2c40, 0x302c40, 0x342c40, 0x3c2c40, 0x402c40, 0x402c3c, 0x402c34, 0x402c30, 0x402c2c, 0x40302c, 0x40342c, 0x403c2c, 0x40402c, 0x3c402c, 0x34402c, 0x30402c, 0x2c402c, 0x2c4030, 0x2c4034, 0x2c403c, 0x2c4040, 0x2c3c40, 0x2c3440, 0x2c3040, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0xFFFFFF],
  WEB : [0x000000,0x000033,0x000066,0x000099,0x0000cc,0x0000ff,0x003300,0x003333,0x003366,0x003399,0x0033cc,0x0033ff,0x006600,0x006633,0x006666,0x006699,0x0066cc,0x0066ff,0x009900,0x009933,0x009966,0x009999,0x0099cc,0x0099ff,0x00cc00,0x00cc33,0x00cc66,0x00cc99,0x00cccc,0x00ccff,0x00ff00,0x00ff33,0x00ff66,0x00ff99,0x00ffcc,0x00ffff,0x330000,0x330033,0x330066,0x330099,0x3300cc,0x3300ff,0x333300,0x333333,0x333366,0x333399,0x3333cc,0x3333ff,0x336600,0x336633,0x336666,0x336699,0x3366cc,0x3366ff,0x339900,0x339933,0x339966,0x339999,0x3399cc,0x3399ff,0x33cc00,0x33cc33,0x33cc66,0x33cc99,0x33cccc,0x33ccff,0x33ff00,0x33ff33,0x33ff66,0x33ff99,0x33ffcc,0x33ffff,0x660000,0x660033,0x660066,0x660099,0x6600cc,0x6600ff,0x663300,0x663333,0x663366,0x663399,0x6633cc,0x6633ff,0x666600,0x666633,0x666666,0x666699,0x6666cc,0x6666ff,0x669900,0x669933,0x669966,0x669999,0x6699cc,0x6699ff,0x66cc00,0x66cc33,0x66cc66,0x66cc99,0x66cccc,0x66ccff,0x66ff00,0x66ff33,0x66ff66,0x66ff99,0x66ffcc,0x66ffff,0x990000,0x990033,0x990066,0x990099,0x9900cc,0x9900ff,0x993300,0x993333,0x993366,0x993399,0x9933cc,0x9933ff,0x996600,0x996633,0x996666,0x996699,0x9966cc,0x9966ff,0x999900,0x999933,0x999966,0x999999,0x9999cc,0x9999ff,0x99cc00,0x99cc33,0x99cc66,0x99cc99,0x99cccc,0x99ccff,0x99ff00,0x99ff33,0x99ff66,0x99ff99,0x99ffcc,0x99ffff,0xcc0000,0xcc0033,0xcc0066,0xcc0099,0xcc00cc,0xcc00ff,0xcc3300,0xcc3333,0xcc3366,0xcc3399,0xcc33cc,0xcc33ff,0xcc6600,0xcc6633,0xcc6666,0xcc6699,0xcc66cc,0xcc66ff,0xcc9900,0xcc9933,0xcc9966,0xcc9999,0xcc99cc,0xcc99ff,0xcccc00,0xcccc33,0xcccc66,0xcccc99,0xcccccc,0xccccff,0xccff00,0xccff33,0xccff66,0xccff99,0xccffcc,0xccffff,0xff0000,0xff0033,0xff0066,0xff0099,0xff00cc,0xff00ff,0xff3300,0xff3333,0xff3366,0xff3399,0xff33cc,0xff33ff,0xff6600,0xff6633,0xff6666,0xff6699,0xff66cc,0xff66ff,0xff9900,0xff9933,0xff9966,0xff9999,0xff99cc,0xff99ff,0xffcc00,0xffcc33,0xffcc66,0xffcc99,0xffcccc,0xffccff,0xffff00,0xffff33,0xffff66,0xffff99,0xffffcc,0xffffff],
  MAC16 : [
  0x000000, 0x444444, 0x888888, 0xBBBBBB,
  0x996633, 0x663300, 0x006600, 0x00aa00,
  0x0099ff, 0x0000cc, 0x330099, 0xff0099,
  0xdd0000, 0xff6600, 0xffff00, 0xffffff],
  lookup : function(palette,r,g,b,a, transparentCol) {
    if (isFinite(transparentCol) && a<128) return transparentCol;
    var maxd = 0xFFFFFF;
    var c = 0;
    palette.forEach(function(p,n) {
      var pr=(p>>16)&255;
      var pg=(p>>8)&255;
      var pb=p&255;
      var pa=(p>>24)&255;
      if (transparentCol=="palette" && pa<128) {
        // if this is a transparent palette entry,
        // either use it or ignore it depending on pixel transparency
        if (a<128) {
          maxd = 0;
          c = n;
        }
        return;
      }
      var dr = r-pr;
      var dg = g-pg;
      var db = b-pb;
      var d = dr*dr + dg*dg + db*db;
      if (d<maxd) {
        c = n;
        maxd=d;
      }
    });
    return c;
  }
};
  var TRANSPARENT_8BIT = 254;

  var FORMATS = {
    "1bit":{
      bpp:1,name:"1 bit black/white",
      fromRGBA:function(r,g,b) {
        var c = (r+g+b) / 3;
        var thresh = 128;
        return c>thresh;
      },toRGBA:function(c) {
        return c ? 0xFFFFFFFF : 0xFF000000;
      }
    },
    "2bitbw":{
      bpp:2,name:"2 bit greyscale",
      fromRGBA:function(r,g,b) {
        var c = (r+g+b) / 3;
        c += 31; // rounding
        if (c>255)c=255;
        return c>>6;
      },toRGBA:function(c) {
        c = c&3;
        c = c | (c<<2) | (c<<4) | (c<<6);
        return 0xFF000000|(c<<16)|(c<<8)|c;
      }
    },
    "4bitbw":{
      bpp:4,name:"4 bit greyscale",
      fromRGBA:function(r,g,b) {
        var c = (r+g+b) / 3;
        c += 7; // rounding
        if (c>255)c=255;
        return c>>4;
      },toRGBA:function(c) {
        c = c&15;
        c = c | (c<<4);
        return 0xFF000000|(c<<16)|(c<<8)|c;
      }
    },
    "8bitbw":{
      bpp:8,name:"8 bit greyscale",
      fromRGBA:function(r,g,b) {
        var c = (r+g+b)/3;
        if (c>255) c=255;
        return c;
      },toRGBA:function(c) {
        c = c&255;
        return 0xFF000000|(c<<16)|(c<<8)|c;
      }
    },
    "3bit":{
      bpp:3,name:"3 bit RGB",
      fromRGBA:function(r,g,b) {
        var thresh = 128;
        return (
          ((r>thresh)?4:0) |
          ((g>thresh)?2:0) |
          ((b>thresh)?1:0));
      },toRGBA:function(c) {
        return ((c&1 ? 0x0000FF : 0x000000) |
                (c&2 ? 0x00FF00 : 0x000000) |
                (c&4 ? 0xFF0000 : 0x000000) |
                0xFF000000);
      }
    },
    "4bit":{
      bpp:4,name:"4 bit ABGR",
      fromRGBA:function(r,g,b,a) {
        var thresh = 128;
        return (
          ((r>thresh)?1:0) |
          ((g>thresh)?2:0) |
          ((b>thresh)?4:0) |
          ((a>thresh)?8:0));
      },toRGBA:function(c) {
        if (!(c&8)) return 0;
        return ((c&1 ? 0xFF0000 : 0x000000) |
                (c&2 ? 0x00FF00 : 0x000000) |
                (c&4 ? 0x0000FF : 0x000000) |
                0xFF000000);
      }
    },
    "4bitmac":{
      bpp:4,name:"4 bit Mac palette",
      fromRGBA:function(r,g,b,a) {
        return PALETTE.lookup(PALETTE.MAC16,r,g,b,a, undefined /* no transparency */);
      },toRGBA:function(c) {
        return 0xFF000000|PALETTE.MAC16[c];
      }
    },
    "vga":{
      bpp:8,name:"8 bit VGA palette",
      fromRGBA:function(r,g,b,a) {
        return PALETTE.lookup(PALETTE.VGA,r,g,b,a, TRANSPARENT_8BIT);
      },toRGBA:function(c) {
        if (c==TRANSPARENT_8BIT) return 0;
        return 0xFF000000|PALETTE.VGA[c];
      }
    },
    "web":{
      bpp:8,name:"8 bit Web palette",
      fromRGBA:function(r,g,b,a) {
        return PALETTE.lookup(PALETTE.WEB,r,g,b,a, TRANSPARENT_8BIT);
      },toRGBA:function(c) {
        if (c==TRANSPARENT_8BIT) return 0;
        return 0xFF000000|PALETTE.WEB[c];
      }
    },
    "rgb565":{
      bpp:16,name:"16 bit RGB565",
      fromRGBA:function(r,g,b,a) {
        return (
          ((r&0xF8)<<8) |
          ((g&0xFC)<<3) |
          ((b&0xF8)>>3));
      },toRGBA:function(c) {
        var r = (c>>8)&0xF8;
        var g = (c>>3)&0xFC;
        var b = (c<<3)&0xF8;
        return 0xFF000000|(r<<16)|(g<<8)|b;
      }
    },
    "opt1bit":{
      bpp:1, optimalPalette:true,name:"Optimal 1 bit",
      fromRGBA:function(r,g,b,a,palette) {
        return PALETTE.lookup(palette.rgb888,r,g,b,a, "palette");
      },toRGBA:function(c,palette) {
        return palette.rgb888[c];
      }
    },
    "opt2bit":{
      bpp:2, optimalPalette:true,name:"Optimal 2 bit",
      fromRGBA:function(r,g,b,a,palette) {
        return PALETTE.lookup(palette.rgb888,r,g,b,a, "palette");
      },toRGBA:function(c,palette) {
        return palette.rgb888[c];
      }
    },
    "opt3bit":{
      bpp:3, optimalPalette:true,name:"Optimal 3 bit",
      fromRGBA:function(r,g,b,a,palette) {
        return PALETTE.lookup(palette.rgb888,r,g,b,a, "palette");
      },toRGBA:function(c,palette) {
        return palette.rgb888[c];
      }
    },
    "opt4bit":{
      bpp:4, optimalPalette:true,name:"Optimal 4 bit",
      fromRGBA:function(r,g,b,a,palette) {
        return PALETTE.lookup(palette.rgb888,r,g,b,a, "palette");
      },toRGBA:function(c,palette) {
        return palette.rgb888[c];
      }
    }
  };
  // What Espruino uses by default
  const BPP_TO_COLOR_FORMAT = {
    1 : "1bit",
    2 : "2bitbw",
    3 : "3bit",
    4 : "4bitmac",
    8 : "web",
    16 : "rgb565"
  };

  const DIFFUSION_TYPES = {
    "none" : "Nearest color (flat)",
    "random1":"Random small",
    "random2":"Random large",
    "error":"Error Diffusion",
    "errorrandom":"Randomised Error Diffusion",
    "bayer2":"2x2 Bayer",
    "bayer4":"4x4 Bayer",
  };

  const BAYER2 = [
    [ 0, 2 ],
    [ 3, 1 ]
  ];
  const BAYER4 = [
    [ 0, 8, 2,10],
    [12, 4,14, 6],
    [ 3,11, 1, 9],
    [15, 7,13, 5]
  ];

  function clip(x) {
    if (x<0) return 0;
    if (x>255) return 255;
    return x;
  }

  // compare two RGB888 colors and give a squared distance value
  function compareRGBA8888(ca,cb) {
    var ar=(ca>>16)&255;
    var ag=(ca>>8)&255;
    var ab=ca&255;
    var aa=(ca>>24)&255;
    var br=(cb>>16)&255;
    var bg=(cb>>8)&255;
    var bb=cb&255;
    var ba=(cb>>24)&255;

    var dr = ar-br;
    var dg = ag-bg;
    var db = ab-bb;
    var da = aa-ba;
    return dr*dr + dg*dg + db*db + da*da;
  }


  /*
  See 'getOptions' for possible options
  */
  function RGBAtoString(rgba, options) {
    options = options||{};
    if (!rgba) throw new Error("No dataIn specified");
    if (!options.width) throw new Error("No Width specified");
    if (!options.height) throw new Error("No Height specified");

    if (options.autoCrop) {
      rgba = autoCrop(rgba, options);
    }

    if ("string"!=typeof options.diffusion)
      options.diffusion = "none";
    options.compression = options.compression || false;
    options.brightness = options.brightness | 0;
    options.contrast = options.contrast | 0;
    options.mode = options.mode || "1bit";
    options.output = options.output || "object";
    options.inverted = options.inverted || false;
    options.transparent = !!options.transparent;
    var contrast =  (259 * (options.contrast + 255)) / (255 * (259 - options.contrast));

    var transparentCol = undefined;
    if (options.transparent) {
      if (options.mode=="4bit")
        transparentCol=0;
      if (options.mode=="vga" || options.mode=="web")
        transparentCol=TRANSPARENT_8BIT;
    }
    var fmt = FORMATS[options.mode];
    if (fmt===undefined) throw new Error("Unknown image mode");
    var bpp = fmt.bpp;
    var bitData = new Uint8Array(((options.width*options.height)*bpp+7)/8);
    var palette, paletteBpp;
    if (fmt.optimalPalette) {
      var oldBPP = bpp, oldMode = options.mode;
      var pixels = readImage(FORMATS["rgb565"]);
      palette = generatePalette(pixels, options);
      if (palette.transparentCol !== undefined)
        transparentCol = palette.transparentCol;
    }

    function readImage(fmt) {
      var bpp = fmt.bpp;
      var pixels = new Int32Array(options.width*options.height);
      var n = 0;
      var er=0,eg=0,eb=0;
      for (var y=0; y<options.height; y++) {
        for (var x=0; x<options.width; x++) {
          var r = rgba[n*4];
          var g = rgba[n*4+1];
          var b = rgba[n*4+2];
          var a = rgba[n*4+3];
          if (options.alphaToColor) {
            r = g = b = a;
          }

          if (options.diffusion == "random1" ||
              options.diffusion == "errorrandom") {
            er += Math.random()*48 - 24;
            eg += Math.random()*48 - 24;
            eb += Math.random()*48 - 24;
          } else if (options.diffusion == "random2") {
            er += Math.random()*128 - 64;
            eg += Math.random()*128 - 64;
            eb += Math.random()*128 - 64;
          } else if (options.diffusion == "bayer2") {
            var th = BAYER2[x&1][y&1]*64 - 96;
            er += th;
            eg += th;
            eb += th;
          } else if (options.diffusion == "bayer4") {
            var th = BAYER4[x&3][y&3]*16 - 96;
            er += th;
            eg += th;
            eb += th;
          }
          if (options.inverted) {
            r=255-r;
            g=255-g;
            b=255-b;
          }
          r = clip(((r + options.brightness - 128)*contrast) + 128 + er);
          g = clip(((g + options.brightness - 128)*contrast) + 128 + eg);
          b = clip(((b + options.brightness - 128)*contrast) + 128 + eb);
          var isTransparent = a<128;

          var c = fmt.fromRGBA(r,g,b,a,palette);
          if (isTransparent && options.transparent && transparentCol===undefined) {
            c = -1;
            a = 0;
          }
          pixels[n] = c;
          // error diffusion
          var cr = fmt.toRGBA(c,palette);
          var oa = cr>>>24;
          var or = (cr>>16)&255;
          var og = (cr>>8)&255;
          var ob = cr&255;
          if (options.diffusion.startsWith("error") && a>128) {
            er = r-or;
            eg = g-og;
            eb = b-ob;
          } else {
            er = 0;
            eg = 0;
            eb = 0;
          }

          n++;
        }
      }
      return pixels;
    }
    function writeImage(pixels) {
      var n = 0;
      for (var y=0; y<options.height; y++) {
        for (var x=0; x<options.width; x++) {
          var c = pixels[n];
          // Write image data
          if (bpp==1) bitData[n>>3] |= c ? 128>>(n&7) : 0;
          else if (bpp==2) bitData[n>>2] |= c<<((3-(n&3))*2);
          else if (bpp==3) {
            c = c&7;
            var bitaddr = n*3;
            var a = bitaddr>>3;
            var shift = bitaddr&7;
            bitData[a] |= (c<<(8-shift)) >> 3;
            bitData[a+1] |= (c<<(16-shift)) >> 3;
          } else if (bpp==4) bitData[n>>1] |= c<<((n&1)?0:4);
          else if (bpp==8) bitData[n] = c;
          else if (bpp==16) { bitData[n<<1] = c>>8; bitData[1+(n<<1)] = c&0xFF; }
          else throw new Error("Unhandled BPP");
          // Write preview
          var cr = fmt.toRGBA(c, palette);
          if (c===transparentCol)
            cr = ((((x>>2)^(y>>2))&1)?0xFFFFFF:0); // pixel pattern
          var oa = cr>>>24;
          var or = (cr>>16)&255;
          var og = (cr>>8)&255;
          var ob = cr&255;
          if (options.rgbaOut) {
            options.rgbaOut[n*4] = or;
            options.rgbaOut[n*4+1]= og;
            options.rgbaOut[n*4+2]= ob;
            options.rgbaOut[n*4+3]=255;
          }
          n++;
        }
      }
    }

    var pixels = readImage(fmt);
    if (options.transparent && transparentCol===undefined && bpp<=16) {
      // we have no fixed transparent colour - pick one that's unused
      var colors = new Uint32Array(1<<bpp);
      // how many colours?
      for (var i=0;i<pixels.length;i++)
        if (pixels[i]>=0)
          colors[pixels[i]]++;
      // find an empty one
      for (var i=0;i<colors.length;i++)
        if (colors[i]==0) {
          transparentCol = i;
          break;
        }
      if (transparentCol===undefined) {
        console.log("No unused colour found - using 0 for transparency");
        for (var i=0;i<pixels.length;i++)
          if (pixels[i]<0)
            pixels[i]=0;
      } else {
        for (var i=0;i<pixels.length;i++)
          if (pixels[i]<0)
            pixels[i]=transparentCol;
      }
    }
    writeImage(pixels);

    var strCmd;
    if ((options.output=="string") || (options.output=="raw")) {
      var transparent = transparentCol!==undefined;
      var header = [];
      header.push(options.width);
      header.push(options.height);
      header.push(bpp + (transparent?128:0) + (palette?64:0));
      if (transparent) header.push(transparentCol);
      if (palette) {
        var p = palette.rgb565;
        for (var i=0;i<p.length;i++) {
          header.push(p[i]&255);
          header.push(p[i]>>8);
        }
      }
      var imgData = new Uint8Array(header.length + bitData.length);
      imgData.set(header, 0);
      imgData.set(bitData, header.length);
      bitData = imgData;
    }
    if (options.compression) {
      bitData = heatshrink.compress(bitData);
      strCmd = 'require("heatshrink").decompress';
    } else {
      strCmd = 'E.toArrayBuffer';
    }
    var str = "";
    for (n=0; n<bitData.length; n++)
      str += String.fromCharCode(bitData[n]);
    var imgstr;
    if (options.output=="raw") {
      imgstr = str;
    } else if (options.output=="object") {
      imgstr = "{\n";
      imgstr += "  width : "+options.width+", height : "+options.height+", bpp : "+bpp+",\n";
      if (transparentCol!==undefined) imgstr += "  transparent : "+transparentCol+",\n";
      if (palette!==undefined) imgstr += "  palette : new Uint16Array(["+palette.rgb565.toString()+"]),\n";
      imgstr += '  buffer : '+strCmd+'(atob("'+btoa(str)+'"))\n';
      imgstr += "}";
    } else if (options.output=="string") {
      imgstr = strCmd+'(atob("'+btoa(str)+'"))';
    } else {
      throw new Error("Unknown output style");
    }
    return imgstr;
  }

  /* Add a checkerboard background to any transparent areas and
  make everything nontransparent. expects width/height in optuons */
  function RGBAtoCheckerboard(rgba, options) {
    var n=0;
    for (var y=0; y<options.height; y++) {
      for (var x=0; x<options.width; x++) {
        var na = rgba[n*4+3]/255;
        var a = 1-na;
        var chequerboard = ((((x>>2)^(y>>2))&1)?0xFFFFFF:0);
        rgba[n*4]   = rgba[n*4]*na + chequerboard*a;
        rgba[n*4+1] = rgba[n*4+1]*na + chequerboard*a;
        rgba[n*4+2] = rgba[n*4+2]*na + chequerboard*a;
        rgba[n*4+3] = 255;
        n++;
      }
    }
  }

  /* Given an image, try and work out a palette.
    Runs off a 32 bit array of pixels (actually just 1 bits) */
  function generatePalette(pixels, options) {
    var fmt = FORMATS[options.mode];
    var bpp = fmt.bpp;
    var bppRange = 1<<bpp;
    var colorUses = {};
    var n=0;
    // count pixel colors - max 65535 so it's not going to kill us
    for (var n=0;n<pixels.length;n++) {
      var px = pixels[n];
      if (!colorUses[px]) colorUses[px]=1;
      else colorUses[px]++;
    }
    // now get as array
    var pixelCols = Object.keys(colorUses);
    var maxUses = 0;
    pixelCols.forEach(col => maxUses=Math.max(maxUses, colorUses[col]));
    // work out scores
    var scores = {};
    pixelCols.forEach(col => {
      // for each color...
      var uses = colorUses[col];
      // work out how close it is to other
      // colors that have more pixels used
      var nearestDiff = 0xFFFFFF;
      pixelCols.forEach(c => {
        if (c==col || colorUses[c]<=uses) return;
        var diff = compareRGBA8888(col,c);
        if (diff<nearestDiff)
          nearestDiff = diff;
      });
      // now our heuristic!
      // the number of pixels we have *plus* how far we are
      // away from an existing color times some number
      scores[col] = uses + (nearestDiff/128);
    });
    // sort based on score...
    pixelCols.sort((a,b)=>scores[b]-scores[a]);
    pixelCols = pixelCols.slice(0,31); // for sanity
    //console.log("All Colors",pixelCols.map(c=>({col:0|c, cnt:colorUses[c], score:scores[c], rgb:(FORMATS["rgb565"].toRGBA(c)&0xFFFFFF).toString(16).padStart(6,"0")})));
    // crop to how many palette items we're allowed
    pixelCols = pixelCols.slice(0,bppRange);
    // debugging...
    //console.log("Palette",pixelCols.map(c=>({col:0|c, cnt:colorUses[c], score:scores[c], rgb:(FORMATS["rgb565"].toRGBA(c)&0xFFFFFF).toString(16).padStart(6,"0")})));
    // Return palettes
    return {
      "rgb565" : new Uint16Array(pixelCols),
      "rgb888" : new Uint32Array(pixelCols.map(c=>c>=0 ? FORMATS["rgb565"].toRGBA(c) : 0)),
      transparentCol : pixelCols.findIndex(c=>c==-1)
    };
  }

  /* Given an image attempt to automatically crop (use top left
  pixel color) */
  function autoCrop(rgba, options) {
    var buf = new Uint32Array(rgba.buffer);
    var stride = options.width;
    var cropCol = buf[0];
    var x1=options.width, x2=0, y1=options.height,y2=2;
    for (var y=0;y<options.height;y++) {
      for (var x=0;x<options.width;x++) {
        if (buf[x+y*stride]!=cropCol) {
          if (x<x1) x1=x;
          if (y<y1) y1=y;
          if (x>x2) x2=x;
          if (y>y2) y2=y;
        }
      }
    }
    // no data! might as well just send it all
    if (x1>x2 || y1>y2) return rgba;
    // ok, crop!
    var w = 1+x2-x1;
    var h = 1+y2-y1;
    var dst = new Uint32Array(w*h);
    for (var y=0;y<h;y++)
      for (var x=0;x<w;x++)
        dst[x+y*w] = buf[(x+x1)+(y+y1)*stride];
    options.width = w;
    options.height = h;
    var cropped = new Uint8ClampedArray(dst.buffer);
    if (options.rgbaOut) options.rgbaOut = cropped;
    return cropped;
  }

  /* RGBAtoString options, PLUS:

  updateCanvas: update canvas with the quantized image
  */
  function canvastoString(canvas, options) {
    options = options||{};
    options.width = canvas.width;
    options.height = canvas.height;
    var ctx = canvas.getContext("2d");
    var imageData = ctx.getImageData(0, 0, options.width, options.height);
    var rgba = imageData.data;
    if (options.updateCanvas)
      options.rgbaOut = rgba;
    var str = RGBAtoString(rgba, options);
    if (options.updateCanvas)
      ctx.putImageData(imageData,0,0);
    return str;
  }

  /* RGBAtoString options, PLUS:

  */
  function imagetoString(img, options) {
    options = options||{};
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img,0,0);
    return canvastoString(canvas, options);
  }

  function getOptions() {
    return {
      width : "int",
      height : "int",
      rgbaOut : "Uint8Array", //  to store quantised data
      diffusion : DIFFUSION_TYPES,
      compression : "bool",
      transparent : "bool",
      brightness : "int", // 0 default +/- 127
      contrast : "int", // 0 default, +/- 255
      mode : Object.keys(FORMATS),
      output : ["object","string","raw"],
      inverted : "bool",
      alphaToColor : "bool",
      autoCrop : "bool", // whether to crop the image's borders or not
    }
  }

  /* Decode an Espruino image string into a URL, return undefined if it's not valid.
  options =  {
    transparent : bool // should the image be transparent, or just chequered where transparent?
  } */
  function stringToImageURL(data, options) {
    options = options||{};
    var p = 0;
    var width = 0|data.charCodeAt(p++);
    var height = 0|data.charCodeAt(p++);
    var bpp = 0|data.charCodeAt(p++);
    var transparentCol = -1;
    if (bpp&128) {
      bpp &= 127;
      transparentCol = 0|data.charCodeAt(p++);
    }
    // TODO: Palettes!
    var mode = BPP_TO_COLOR_FORMAT[bpp];
    if (!mode) {
      console.log("Couldn't guess format");
      return undefined; // unknown format
    }
    var fmt = FORMATS[mode];
    var bitmapSize = ((width*height*bpp)+7) >> 3;
    // If it's the wrong length, it's not a bitmap or it's corrupt!
    if (data.length != p+bitmapSize)
      return undefined;
    // Ok, build the picture
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    var imageData = ctx.getImageData(0, 0, width, height);
    var rgba = imageData.data;
    var no = 0;
    var nibits = 0;
    var nidata = 0;
    for (var i=0;i<width*height;i++) {
      while (nibits<bpp) {
        nidata = (nidata<<8) | data.charCodeAt(p++);
        nibits += 8;
      }
      var c = (nidata>>(nibits-bpp)) & ((1<<bpp)-1);
      nibits -= bpp;
      var cr = fmt.toRGBA(c);
      if (c == transparentCol)
        cr = cr & 0xFFFFFF;
      rgba[no++] = (cr>>16)&255; // r
      rgba[no++] = (cr>>8)&255; // g
      rgba[no++] = cr&255; // b
      rgba[no++] = cr>>>24; // a
    }
    if (!options.transparent)
      RGBAtoCheckerboard(rgba, {width:width, height:height});
    ctx.putImageData(imageData,0,0);
    return canvas.toDataURL();
  }

// decode an Espruino image string into an HTML string, return undefined if it's not valid. See stringToImageURL
  function stringToImageHTML(data, options) {
    var url = stringToImageURL(data, options);
    if (!url) return undefined;
    return '<img src="'+url+'"\>';
  }

  function setFormatOptions(div) {
    div.innerHTML = Object.keys(FORMATS).map(id => `<option value="${id}">${FORMATS[id].name}</option>`).join("\n");
  }

  function setDiffusionOptions(div) {
    div.innerHTML = Object.keys(DIFFUSION_TYPES).map(id => `<option value="${id}">${DIFFUSION_TYPES[id]}</option>`).join("\n");
  }

  // =======================================================
  return {
    RGBAtoString : RGBAtoString,
    RGBAtoCheckerboard : RGBAtoCheckerboard,
    canvastoString : canvastoString,
    imagetoString : imagetoString,
    getOptions : getOptions,
    getFormats : function() { return FORMATS; },
    setFormatOptions : setFormatOptions,
    setDiffusionOptions : setDiffusionOptions,

    stringToImageHTML : stringToImageHTML,
    stringToImageURL : stringToImageURL
  };
}));
