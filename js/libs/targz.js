// From https://gist.github.com/kig/417483
TarGZ = function(){};

// Load and parse archive, calls onload after loading all files.
TarGZ.load = function(url, onload, onstream, onerror) {
  var o = new TarGZ();
  o.onload = onload;
  o.onerror = onerror;
  o.onstream = onstream;
  o.load(url);
  return o;
}

// Streams an archive from the given url, calling onstream after loading each file in archive.
// Calls onload after loading all files.
TarGZ.stream = function(url, onstream, onload, onerror) {
  var o = new TarGZ();
  o.onload = onload;
  o.onerror = onerror;
  o.onstream = onstream;
  o.load(url);
  return o;
}
TarGZ.prototype = {
  onerror : null,
  onload : null,
  onstream : null,
  ondata : null,
  
  load : function(url) {
    var self = this;
    var offset = {chunkBytes: 0, chunks: 0};
    var byteOffset = 0;
    this.files = [];
    GZip.load(url,
      function(h) {
        byteOffset = self.processTarChunks(h.data, byteOffset, h.outputSize);
        if (self.onload)
          self.onload(self.files, h);
      },
      function(h) {
        self.gzip = h;
        if (self.ondata) self.ondata(h);
        byteOffset = self.processTarChunks(h.data, byteOffset, h.outputSize);
      },
      function(xhr, e, h) {
        if (self.onerror)
          self.onerror(xhr, e, h);
      }
    );
  },
 
  cleanHighByte : function(s) {
    return s.replace(/./g, function(m) { 
      return String.fromCharCode(m.charCodeAt(0) & 0xff);
    });
  },
  
  parseTar : function(text) {
    this.files = [];
    this.processTarChunks([text], 0, text.length);
  },
  processTarChunks : function (chunks, offset, totalSize) {
    while (totalSize >= offset + 512) {
      var header = this.files.length == 0 ? null : this.files[this.files.length-1];
      if (header && header.data == null) {
        if (offset + header.length <= totalSize) {
          header.data = this.chunkSubstring(chunks, offset, offset+header.length);
          header.toDataURL = this.__toDataURL;
          offset += 512 * Math.ceil(header.length / 512);
          if (this.onstream) 
            this.onstream(header, this.gzip);
        } else { // not loaded yet
          break;
        }
      } else {
        var s = this.chunkSubstring(chunks, offset, offset+512);
        var header = this.parseTarHeader(s, 0);
        if (header.length > 0 || header.filename != '') {
          this.files.push(header);
          offset += 512;
          header.offset = offset;
        } else { // empty header, stop processing
          offset = totalSize;
        }
      }
    }
    return offset;
  },
  parseTarHeader : function(text, offset) {
    var i = offset || 0;
    var h = {};
    h.filename = text.substring(i, i+=100).split("\0", 1)[0];
    h.mode = text.substring(i, i+=8).split("\0", 1)[0];
    h.uid = text.substring(i, i+=8).split("\0", 1)[0];
    h.gid = text.substring(i, i+=8).split("\0", 1)[0];
    h.length = this.parseTarNumber(text.substring(i, i+=12));
    h.lastModified = text.substring(i, i+=12).split("\0", 1)[0];
    h.checkSum = text.substring(i, i+=8).split("\0", 1)[0];
    h.fileType = text.substring(i, i+=1).split("\0", 1)[0];
    h.linkName = text.substring(i, i+=100).split("\0", 1)[0];
    return h;
  },
  parseTarNumber : function(text) {
    // if (text.charCodeAt(0) & 0x80 == 1) {
    // GNU tar 8-byte binary big-endian number
    // } else {
      return parseInt(text.replace(/[^\d]/g, ''), 8);
    // }
  },

  // extract substring from an array of strings
  chunkSubstring : function (chunks, start, end) {
    var soff=0, eoff=0, i=0, j=0;
    for (i=0; i<chunks.length; i++) {
      if (soff + chunks[i].length > start)
        break;
      soff += chunks[i].length;
    }
    var strs = [];
    eoff = soff;
    for (j=i; j<chunks.length; j++) {
      strs.push(chunks[j]);
      if (eoff + chunks[j].length > end)
        break;
      eoff += chunks[j].length;
    }
    var s = strs.join('');
    return s.substring(start-soff, start-soff+(end-start));
  },

  __toDataURL : function() {
    if (this.data.substring(0,40).match(/^data:[^\/]+\/[^,]+,/)) {
      return this.data;
    } else if (TarGZ.prototype.cleanHighByte(this.data.substring(0,10)).match(/\377\330\377\340..JFIF/)) {
      return 'data:image/jpeg;base64,'+btoa(TarGZ.prototype.cleanHighByte(this.data));
    } else if (TarGZ.prototype.cleanHighByte(this.data.substring(0,6)) == "\211PNG\r\n") {
      return 'data:image/png;base64,'+btoa(TarGZ.prototype.cleanHighByte(this.data));
    } else if (TarGZ.prototype.cleanHighByte(this.data.substring(0,6)).match(/GIF8[79]a/)) {
      return 'data:image/gif;base64,'+btoa(TarGZ.prototype.cleanHighByte(this.data));
    } else {
      throw("toDataURL: I don't know how to handle " + this.filename);
    }
  }
}



Bin = {
  byte : function(s, offset) {
    return s.charCodeAt(offset) & 0xff;
  },

  UInt16BE : function(s, offset) {
    return ((Bin.byte(s, offset) << 8) | Bin.byte(s, offset+1));
  },

  UInt32BE : function(s, offset) {
    return (
      (Bin.byte(s, offset) << 24) |
      (Bin.byte(s, offset+1) << 16) |
      (Bin.byte(s, offset+2) << 8) |
       Bin.byte(s, offset+3));
  },

  UInt16LE : function(s, offset) {
    return ((Bin.byte(s, offset+1) << 8) | Bin.byte(s, offset));
  },

  UInt32LE : function(s, offset) {
    return (
      (Bin.byte(s, offset+3) << 24) |
      (Bin.byte(s, offset+2) << 16) |
      (Bin.byte(s, offset+1) << 8) |
       Bin.byte(s, offset));
  },

  CString : function(s, offset) {
    var zeroIdx = offset;
    for (; zeroIdx<s.length; zeroIdx++) {
      if (Bin.byte(s, zeroIdx) == 0)
        break;
    }
    if (zeroIdx == s.length)
      throw("No null byte encountered");
    return s.substring(offset, zeroIdx);
  },

  CRC16 : function(s, start, length, crc) {
    return crc32(s, start, length, crc) & 0xffff;
  },

  CRC32 : function(s, start, length, crc) {
    return crc32(s, start, length, crc);
  }
};

GZip = {
  DEFLATE:  8,
  FTEXT:    1 << 0,
  FHCRC:    1 << 1,
  FEXTRA:   1 << 2,
  FNAME:    1 << 3,
  FCOMMENT: 1 << 4,

  load : function(url, onload, onstream, onerror) {
    var xhr = new XMLHttpRequest();
    var self = this;
    var h = null;
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        if (xhr.status == 200 || xhr.status == 0) {
          var s = xhr.responseText;
          try {
            var t = new Date;
            if (!h) h = self.parseHeader(s);
            self.parseAllBody(s, h, onstream);
            self.parseFooter(s, h);
            var elapsed = new Date() - t;
            h.decompressionTime += elapsed;
          } catch(e) {
            onerror(xhr, e, h);
            return;
          }
          if (onload)
            onload(h, xhr);
        } else {
          if (onerror)
            onerror(xhr);
        }
      } else if (xhr.readyState == 3) {
        if (xhr.status == 200 || xhr.status == 0) {
          var s = xhr.responseText;
          if (s.length < 1024) return; // read in header
          try {
            var t = new Date;
            if (!h) h = self.parseHeader(s);
            self.parseBody(s, h, onstream);
            var elapsed = new Date() - t;
            h.decompressionTime += elapsed;
          } catch(e) {
            return;
          }
        }
      }
    };
    xhr.open("GET", url, true);
    xhr.overrideMimeType("text/plain; charset=x-user-defined");
    xhr.setRequestHeader("Content-Type", "text/plain");
    xhr.send(null);
  },

  parseHeader : function(s) {
    var h = {};
    h.decompressionTime = 0;
    h.id1 = Bin.byte(s,0);
    h.id2 = Bin.byte(s,1);
    h.compressionMethod = Bin.byte(s,2);
    if (h.id1 != 0x1f || h.id2 != 0x8b || h.compressionMethod != GZip.DEFLATE) {
      throw("Not a GZip file: " + h.id1 + ',' + h.id2 + ',' + h.compressionMethod);
    }
    h.flags = Bin.byte(s,3);
    h.mtime = Bin.UInt32LE(s, 4);
    h.extraFlags = Bin.byte(s, 8);
    h.operatingSystem = Bin.byte(s, 9);
    var offset = 10;
    if (h.flags & GZip.FEXTRA) {
      var xlen = Bin.UInt16LE(s, offset);
      offset += 2;
      h.extraField = s.substring(offset, offset+xlen);
      offset += xlen;
    }
    if (h.flags & GZip.FNAME) {
      h.filename = Bin.CString(s, offset);
      offset += h.filename.length + 1;
    }
    if (h.flags & GZip.FCOMMENT) {
      h.comment = Bin.CString(s, offset);
      offset += h.comment.length + 1;
    }
    h.computedHeaderCRC16 = Bin.CRC16(s, 0, offset, 0);
    if (h.flags & GZip.FHCRC) {
      h.headerCRC16 = Bin.UInt16LE(s, offset);
      if (h.computedHeaderCRC16 != null && h.headerCRC16 != h.computedHeaderCRC16)
        throw("Header CRC16 check failed");
      offset += 2;
    }
    h.offset = offset;
    h.data = [];
    h.outputSize = 0;
    h.inflater = new Inflater();
    h.inflater.start_inflate(h);
    return h;
  },
  
  parseBody : function(s, h, onstream) {
    h.inflater.continue_inflate(s, h, onstream);
    return h;
  },
  
  parseAllBody : function(s, h, onstream) {
    h.inflater.final_inflate(s, h, onstream);
    return h;
  },
  
  parseFooter : function(s, h) {
    h.CRC32 = Bin.UInt32LE(s, s.length-8);
    if (h.computedCRC32 && h.computedCRC32 != h.CRC32)
      throw("Data CRC32 check failed");
    h.inputSize = Bin.UInt32LE(s, s.length-4);
    if (h.data != null && h.inputSize != (h.outputSize % 0xffffffff))
      throw("Data length check failed");
    return h;
  }
};













/*   
=============================================================================== 
Crc32 is a JavaScript function for computing the CRC32 of a string 
............................................................................... 
 
Version: 1.2 - 2006/11 - http://noteslog.com/category/javascript/ 
 
------------------------------------------------------------------------------- 
Copyright (c) 2006 Andrea Ercolino 
http://www.opensource.org/licenses/mit-license.php 
=============================================================================== 
*/ 
 
(function() { 
    var table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";
    var intTable = [];
    for (var i=0; i < table.length / 9; i++) {
      intTable.push(parseInt("0x"+table.substr( i*9, 8)));
    }
    /* Number */ 
    crc32 = function( /* String */ str, start, length, /* Number */ crc ) { 
        crc = crc ^ (-1);
        var end = Math.min(str.length, start + length);
        for( var i = start; i < end; i++ ) {
            var n = ( crc ^ str.charCodeAt( i ) ) & 0xFF; 
            crc = ( crc >>> 8 ) ^ intTable[n];
        } 
        return crc ^ (-1); 
    }; 
})();








/*
 * $Id: rawinflate.js,v 0.2 2009/03/01 18:32:24 dankogai Exp $
 *
 * original:
 * http://www.onicos.com/staff/iz/amuse/javascript/expert/inflate.txt
 */

Inflater = (function(){

/* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
 * Version: 1.0.0.1
 * LastModified: Dec 25 1999
 */

/* Interface:
 * data = zip_inflate(src);
 */

/* constant parameters */
var zip_WSIZE = 32768;        // Sliding Window size
var zip_STORED_BLOCK = 0;
var zip_STATIC_TREES = 1;
var zip_DYN_TREES  = 2;

/* for inflate */
var zip_lbits = 9;         // bits in base literal/length lookup table
var zip_dbits = 6;         // bits in base distance lookup table
var zip_INBUFSIZ = 32768;    // Input buffer size
var zip_INBUF_EXTRA = 64;    // Extra buffer

/* variables (inflate) */
var zip_slide;
var zip_wp;            // current position in slide
var zip_fixed_tl = null;    // inflate static
var zip_fixed_td;        // inflate static
var zip_fixed_bl, fixed_bd;    // inflate static
var zip_bit_buf;        // bit buffer
var zip_bit_len;        // bits in bit buffer
var zip_method;
var zip_eof;
var zip_copy_leng;
var zip_copy_dist;
var zip_tl, zip_td;    // literal/length and distance decoder tables
var zip_bl, zip_bd;    // number of bits decoded by tl and td

var zip_inflate_data;
var zip_inflate_pos;


/* constant tables (inflate) */
var zip_MASK_BITS = new Array(
  0x0000,
  0x0001, 0x0003, 0x0007, 0x000f, 0x001f, 0x003f, 0x007f, 0x00ff,
  0x01ff, 0x03ff, 0x07ff, 0x0fff, 0x1fff, 0x3fff, 0x7fff, 0xffff);
// Tables for deflate from PKZIP's appnote.txt.
var zip_cplens = new Array( // Copy lengths for literal codes 257..285
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0);
/* note: see note #13 above about the 258 in this list. */
var zip_cplext = new Array( // Extra bits for literal codes 257..285
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2,
  3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 99, 99); // 99==invalid
var zip_cpdist = new Array( // Copy offsets for distance codes 0..29
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
  8193, 12289, 16385, 24577);
var zip_cpdext = new Array( // Extra bits for distance codes
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6,
  7, 7, 8, 8, 9, 9, 10, 10, 11, 11,
  12, 12, 13, 13);
var zip_border = new Array(  // Order of the bit length code lengths
  16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15);
/* objects (inflate) */

var zip_HuftList = function() {
  this.next = null;
  this.list = null;
}

var zip_HuftNode = function() {
  this.e = 0; // number of extra bits or operation
  this.b = 0; // number of bits in this code or subcode

  // union
  this.n = 0; // literal, length base, or distance base
  this.t = null; // (zip_HuftNode) pointer to next level of table
}

var zip_HuftBuild = function(b,    // code lengths in bits (all assumed <= BMAX)
             n,    // number of codes (assumed <= N_MAX)
             s,    // number of simple-valued codes (0..s-1)
             d,    // list of base values for non-simple codes
             e,    // list of extra bits for non-simple codes
             mm    // maximum lookup bits
           ) {
  this.BMAX = 16;   // maximum bit length of any code
  this.N_MAX = 288; // maximum number of codes in any set
  this.status = 0;    // 0: success, 1: incomplete table, 2: bad input
  this.root = null;    // (zip_HuftList) starting table
  this.m = 0;        // maximum lookup bits, returns actual

/* Given a list of code lengths and a maximum table size, make a set of
   tables to decode that set of codes.    Return zero on success, one if
   the given code set is incomplete (the tables are still built in this
   case), two if the input is invalid (all zero length codes or an
   oversubscribed set of lengths), and three if not enough memory.
   The code with value 256 is special, and the tables are constructed
   so that no bits beyond that code are fetched when that code is
   decoded. */
  {
    var a;            // counter for codes of length k
    var c = new Array(this.BMAX+1);    // bit length count table
    var el;            // length of EOB code (value 256)
    var f;            // i repeats in table every f entries
    var g;            // maximum code length
    var h;            // table level
    var i;            // counter, current code
    var j;            // counter
    var k;            // number of bits in current code
    var lx = new Array(this.BMAX+1);    // stack of bits per table
    var p;            // pointer into c[], b[], or v[]
    var pidx;        // index of p
    var q;            // (zip_HuftNode) points to current table
    var r = new zip_HuftNode(); // table entry for structure assignment
    var u = new Array(this.BMAX); // zip_HuftNode[BMAX][]  table stack
    var v = new Array(this.N_MAX); // values in order of bit length
    var w;
    var x = new Array(this.BMAX+1);// bit offsets, then code stack
    var xp;            // pointer into x or c
    var y;            // number of dummy codes added
    var z;            // number of entries in current table
    var o;
    var tail;        // (zip_HuftList)

    tail = this.root = null;
    for(i = 0; i < c.length; i++)
      c[i] = 0;
    for(i = 0; i < lx.length; i++)
      lx[i] = 0;
    for(i = 0; i < u.length; i++)
      u[i] = null;
    for(i = 0; i < v.length; i++)
      v[i] = 0;
    for(i = 0; i < x.length; i++)
      x[i] = 0;

    // Generate counts for each bit length
    el = n > 256 ? b[256] : this.BMAX; // set length of EOB code, if any
    p = b; pidx = 0;
    i = n;
    do {
      c[p[pidx]]++;    // assume all entries <= BMAX
      pidx++;
    } while(--i > 0);
    if(c[0] == n) {    // null input--all zero length codes
      this.root = null;
      this.m = 0;
      this.status = 0;
      return;
    }

    // Find minimum and maximum length, bound *m by those
    for(j = 1; j <= this.BMAX; j++)
      if(c[j] != 0)
        break;
    k = j;            // minimum code length
    if(mm < j)
      mm = j;
    for(i = this.BMAX; i != 0; i--)
      if(c[i] != 0)
        break;
    g = i;            // maximum code length
    if(mm > i)
      mm = i;

    // Adjust last length count to fill out codes, if needed
    for(y = 1 << j; j < i; j++, y <<= 1)
      if((y -= c[j]) < 0) {
        this.status = 2;    // bad input: more codes than bits
        this.m = mm;
        return;
      }
    if((y -= c[i]) < 0) {
      this.status = 2;
      this.m = mm;
      return;
    }
    c[i] += y;

    // Generate starting offsets into the value table for each length
    x[1] = j = 0;
    p = c;
    pidx = 1;
    xp = 2;
    while(--i > 0)        // note that i == g from above
      x[xp++] = (j += p[pidx++]);

    // Make a table of values in order of bit lengths
    p = b; pidx = 0;
    i = 0;
    do {
      if((j = p[pidx++]) != 0)
        v[x[j]++] = i;
    } while(++i < n);
    n = x[g];            // set n to length of v

    // Generate the Huffman codes and for each, make the table entries
    x[0] = i = 0;        // first Huffman code is zero
    p = v; pidx = 0;        // grab values in bit order
    h = -1;            // no tables yet--level -1
    w = lx[0] = 0;        // no bits decoded yet
    q = null;            // ditto
    z = 0;            // ditto

    // go through the bit lengths (k already is bits in shortest code)
    for(; k <= g; k++) {
      a = c[k];
      while(a-- > 0) {
        // here i is the Huffman code of length k bits for value p[pidx]
        // make tables up to required level
        while(k > w + lx[1 + h]) {
          w += lx[1 + h]; // add bits already decoded
          h++;

          // compute minimum size table less than or equal to *m bits
          z = (z = g - w) > mm ? mm : z; // upper limit
          if((f = 1 << (j = k - w)) > a + 1) { // try a k-w bit table
            // too few codes for k-w bit table
            f -= a + 1;    // deduct codes from patterns left
            xp = k;
            while(++j < z) { // try smaller tables up to z bits
              if((f <<= 1) <= c[++xp])
                break;    // enough codes to use up j bits
              f -= c[xp];    // else deduct codes from patterns
            }
          }
          if(w + j > el && w < el)
            j = el - w;    // make EOB code end at table
          z = 1 << j;    // table entries for j-bit table
          lx[1 + h] = j; // set table size in stack

          // allocate and link in new table
          q = new Array(z);
          for(o = 0; o < z; o++) {
            q[o] = new zip_HuftNode();
          }

          if(tail == null)
            tail = this.root = new zip_HuftList();
          else
            tail = tail.next = new zip_HuftList();
          tail.next = null;
          tail.list = q;
          u[h] = q;    // table starts after link

          /* connect to last table, if there is one */
          if(h > 0) {
            x[h] = i;        // save pattern for backing up
            r.b = lx[h];    // bits to dump before this table
            r.e = 16 + j;    // bits in this table
            r.t = q;        // pointer to this table
            j = (i & ((1 << w) - 1)) >> (w - lx[h]);
            u[h-1][j].e = r.e;
            u[h-1][j].b = r.b;
            u[h-1][j].n = r.n;
            u[h-1][j].t = r.t;
          }
        }

        // set up table entry in r
        r.b = k - w;
        if(pidx >= n)
          r.e = 99;        // out of values--invalid code
        else if(p[pidx] < s) {
          r.e = (p[pidx] < 256 ? 16 : 15); // 256 is end-of-block code
          r.n = p[pidx++];    // simple code is just the value
        } else {
          r.e = e[p[pidx] - s];    // non-simple--look up in lists
          r.n = d[p[pidx++] - s];
        }

        // fill code-like entries with r //
        f = 1 << (k - w);
        for(j = i >> w; j < z; j += f) {
          q[j].e = r.e;
          q[j].b = r.b;
          q[j].n = r.n;
          q[j].t = r.t;
        }

        // backwards increment the k-bit code i
        for(j = 1 << (k - 1); (i & j) != 0; j >>= 1)
          i ^= j;
        i ^= j;

        // backup over finished tables
        while((i & ((1 << w) - 1)) != x[h]) {
          w -= lx[h];        // don't need to update q
          h--;
        }
      }
    }

    /* return actual size of base table */
    this.m = lx[1];

    /* Return true (1) if we were given an incomplete table */
    this.status = ((y != 0 && g != 1) ? 1 : 0);
  } /* end of constructor */
}


/* routines (inflate) */

var zip_GET_BYTE = function() {
  if(zip_inflate_data.length <= zip_inflate_pos)
    return -1;
  return zip_inflate_data.charCodeAt(zip_inflate_pos++) & 0xff;
}

var zip_NEEDBITS = function(n) {
  while(zip_bit_len < n) {
    zip_bit_buf |= zip_GET_BYTE() << zip_bit_len;
    zip_bit_len += 8;
  }
}

var zip_GETBITS = function(n) {
  return zip_bit_buf & zip_MASK_BITS[n];
}

var zip_DUMPBITS = function(n) {
  zip_bit_buf >>= n;
  zip_bit_len -= n;
}

var zip_inflate_codes = function(buff, off, size) {
  /* inflate (decompress) the codes in a deflated (compressed) block.
     Return an error code or zero if it all goes ok. */
  var e;        // table entry flag/number of extra bits
  var t;        // (zip_HuftNode) pointer to table entry
  var n;

  if(size == 0)
    return 0;

  // inflate the coded data
  n = 0;
  for(;;) {            // do until end of block
    zip_NEEDBITS(zip_bl);
    t = zip_tl.list[zip_GETBITS(zip_bl)];
    e = t.e;
    while(e > 16) {
      if(e == 99)
        return -1;
      zip_DUMPBITS(t.b);
      e -= 16;
      zip_NEEDBITS(e);
      t = t.t[zip_GETBITS(e)];
      e = t.e;
    }
    zip_DUMPBITS(t.b);

    if(e == 16) {        // then it's a literal
      zip_wp &= zip_WSIZE - 1;
      buff[off + n++] = zip_slide[zip_wp++] = t.n;
      if(n == size)
        return size;
      continue;
    }

    // exit if end of block
    if(e == 15)
      break;

    // it's an EOB or a length

    // get length of block to copy
    zip_NEEDBITS(e);
    zip_copy_leng = t.n + zip_GETBITS(e);
    zip_DUMPBITS(e);

    // decode distance of block to copy
    zip_NEEDBITS(zip_bd);
    t = zip_td.list[zip_GETBITS(zip_bd)];
    e = t.e;

    while(e > 16) {
      if(e == 99)
        return -1;
      zip_DUMPBITS(t.b);
      e -= 16;
      zip_NEEDBITS(e);
      t = t.t[zip_GETBITS(e)];
      e = t.e;
    }
    zip_DUMPBITS(t.b);
    zip_NEEDBITS(e);
    zip_copy_dist = zip_wp - t.n - zip_GETBITS(e);
    zip_DUMPBITS(e);

    // do the copy
    while(zip_copy_leng > 0 && n < size) {
      zip_copy_leng--;
      zip_copy_dist &= zip_WSIZE - 1;
      zip_wp &= zip_WSIZE - 1;
      buff[off + n++] = zip_slide[zip_wp++]
        = zip_slide[zip_copy_dist++];
    }

    if(n == size)
      return size;
  }

  zip_method = -1; // done
  return n;
}

var zip_inflate_stored = function(buff, off, size) {
  /* "decompress" an inflated type 0 (stored) block. */
  var n;

  // go to byte boundary
  n = zip_bit_len & 7;
  zip_DUMPBITS(n);

  // get the length and its complement
  zip_NEEDBITS(16);
  n = zip_GETBITS(16);
  zip_DUMPBITS(16);
  zip_NEEDBITS(16);
  if(n != ((~zip_bit_buf) & 0xffff))
    return -1;            // error in compressed data
  zip_DUMPBITS(16);

  // read and output the compressed data
  zip_copy_leng = n;

  n = 0;
  while(zip_copy_leng > 0 && n < size) {
    zip_copy_leng--;
    zip_wp &= zip_WSIZE - 1;
    zip_NEEDBITS(8);
    buff[off + n++] = zip_slide[zip_wp++] =
      zip_GETBITS(8);
    zip_DUMPBITS(8);
  }

  if(zip_copy_leng == 0)
    zip_method = -1; // done
  return n;
}

var zip_inflate_fixed = function(buff, off, size) {
  /* decompress an inflated type 1 (fixed Huffman codes) block.  We should
     either replace this with a custom decoder, or at least precompute the
     Huffman tables. */

  // if first time, set up tables for fixed blocks
  if(zip_fixed_tl == null) {
    var i;            // temporary variable
    var l = new Array(288);    // length list for huft_build
    var h;    // zip_HuftBuild

    // literal table
    for(i = 0; i < 144; i++)
      l[i] = 8;
    for(; i < 256; i++)
      l[i] = 9;
    for(; i < 280; i++)
      l[i] = 7;
    for(; i < 288; i++)    // make a complete, but wrong code set
      l[i] = 8;
    zip_fixed_bl = 7;

    h = new zip_HuftBuild(l, 288, 257, zip_cplens, zip_cplext,
                zip_fixed_bl);
    if(h.status != 0) {
      alert("HufBuild error: "+h.status);
      return -1;
    }
    zip_fixed_tl = h.root;
    zip_fixed_bl = h.m;

    // distance table
    for(i = 0; i < 30; i++)    // make an incomplete code set
      l[i] = 5;
    zip_fixed_bd = 5;

    h = new zip_HuftBuild(l, 30, 0, zip_cpdist, zip_cpdext, zip_fixed_bd);
    if(h.status > 1) {
      zip_fixed_tl = null;
      throw("HufBuild error: "+h.status);
      return -1;
    }
    zip_fixed_td = h.root;
    zip_fixed_bd = h.m;
  }

  zip_tl = zip_fixed_tl;
  zip_td = zip_fixed_td;
  zip_bl = zip_fixed_bl;
  zip_bd = zip_fixed_bd;
  return zip_inflate_codes(buff, off, size);
}

var zip_inflate_dynamic = function(buff, off, size) {
  // decompress an inflated type 2 (dynamic Huffman codes) block.
  var i;        // temporary variables
  var j;
  var l;        // last length
  var n;        // number of lengths to get
  var t;        // (zip_HuftNode) literal/length code table
  var nb;        // number of bit length codes
  var nl;        // number of literal/length codes
  var nd;        // number of distance codes
  var ll = new Array(286+30); // literal/length and distance code lengths
  var h;        // (zip_HuftBuild)

  for(i = 0; i < ll.length; i++)
    ll[i] = 0;

  // read in table lengths
  zip_NEEDBITS(5);
  nl = 257 + zip_GETBITS(5);    // number of literal/length codes
  zip_DUMPBITS(5);
  zip_NEEDBITS(5);
  nd = 1 + zip_GETBITS(5);    // number of distance codes
  zip_DUMPBITS(5);
  zip_NEEDBITS(4);
  nb = 4 + zip_GETBITS(4);    // number of bit length codes
  zip_DUMPBITS(4);
  if(nl > 286 || nd > 30)
    return -1;        // bad lengths

  // read in bit-length-code lengths
  for(j = 0; j < nb; j++)
  {
    zip_NEEDBITS(3);
    ll[zip_border[j]] = zip_GETBITS(3);
    zip_DUMPBITS(3);
  }
  for(; j < 19; j++)
    ll[zip_border[j]] = 0;

  // build decoding table for trees--single level, 7 bit lookup
  zip_bl = 7;
  h = new zip_HuftBuild(ll, 19, 19, null, null, zip_bl);
  if(h.status != 0)
    return -1;    // incomplete code set

  zip_tl = h.root;
  zip_bl = h.m;

  // read in literal and distance code lengths
  n = nl + nd;
  i = l = 0;
  while(i < n) {
    zip_NEEDBITS(zip_bl);
    t = zip_tl.list[zip_GETBITS(zip_bl)];
    j = t.b;
    zip_DUMPBITS(j);
    j = t.n;
    if(j < 16)        // length of code in bits (0..15)
      ll[i++] = l = j;    // save last length in l
    else if(j == 16) {    // repeat last length 3 to 6 times
      zip_NEEDBITS(2);
      j = 3 + zip_GETBITS(2);
      zip_DUMPBITS(2);
      if(i + j > n)
        return -1;
      while(j-- > 0)
        ll[i++] = l;
    } else if(j == 17) {    // 3 to 10 zero length codes
      zip_NEEDBITS(3);
      j = 3 + zip_GETBITS(3);
      zip_DUMPBITS(3);
      if(i + j > n)
        return -1;
      while(j-- > 0)
        ll[i++] = 0;
      l = 0;
    } else {        // j == 18: 11 to 138 zero length codes
      zip_NEEDBITS(7);
      j = 11 + zip_GETBITS(7);
      zip_DUMPBITS(7);
      if(i + j > n)
        return -1;
      while(j-- > 0)
        ll[i++] = 0;
      l = 0;
    }
  }

  // build the decoding tables for literal/length and distance codes
  zip_bl = zip_lbits;
  h = new zip_HuftBuild(ll, nl, 257, zip_cplens, zip_cplext, zip_bl);
  if(zip_bl == 0)    // no literals or lengths
    h.status = 1;
  if(h.status != 0) {
    if(h.status == 1)
      ;// **incomplete literal tree**
    return -1;        // incomplete code set
  }
  zip_tl = h.root;
  zip_bl = h.m;

  for(i = 0; i < nd; i++)
    ll[i] = ll[i + nl];
  zip_bd = zip_dbits;
  h = new zip_HuftBuild(ll, nd, 0, zip_cpdist, zip_cpdext, zip_bd);
  zip_td = h.root;
  zip_bd = h.m;

  if(zip_bd == 0 && nl > 257) {   // lengths but no distances
    // **incomplete distance tree**
    return -1;
  }

  if(h.status == 1) {
    ;// **incomplete distance tree**
  }
  if(h.status != 0)
    return -1;

  // decompress until an end-of-block code
  return zip_inflate_codes(buff, off, size);
}

var zip_inflate_start = function() {
  var i;

  if(zip_slide == null)
    zip_slide = new Array(2 * zip_WSIZE);
  zip_wp = 0;
  zip_bit_buf = 0;
  zip_bit_len = 0;
  zip_method = -1;
  zip_eof = false;
  zip_copy_leng = zip_copy_dist = 0;
  zip_tl = null;
}

var zip_inflate_internal = function(buff, off, size) {
  // decompress an inflated entry
  var n, i;

  n = 0;
  while(n < size) {
    if(zip_eof && zip_method == -1)
      return n;

    if(zip_copy_leng > 0) {
      if(zip_method != zip_STORED_BLOCK) {
        // STATIC_TREES or DYN_TREES
        while(zip_copy_leng > 0 && n < size) {
          zip_copy_leng--;
          zip_copy_dist &= zip_WSIZE - 1;
          zip_wp &= zip_WSIZE - 1;
          buff[off + n++] = zip_slide[zip_wp++] =
            zip_slide[zip_copy_dist++];
        }
      } else {
        while(zip_copy_leng > 0 && n < size) {
          zip_copy_leng--;
          zip_wp &= zip_WSIZE - 1;
          zip_NEEDBITS(8);
          buff[off + n++] = zip_slide[zip_wp++] = zip_GETBITS(8);
          zip_DUMPBITS(8);
        }
        if(zip_copy_leng == 0)
          zip_method = -1; // done
      }
      if(n == size)
        return n;
    }

    if(zip_method == -1) {
      if(zip_eof)
        break;

      // read in last block bit
      zip_NEEDBITS(1);
      if(zip_GETBITS(1) != 0)
        zip_eof = true;
      zip_DUMPBITS(1);

      // read in block type
      zip_NEEDBITS(2);
      zip_method = zip_GETBITS(2);
      zip_DUMPBITS(2);
      zip_tl = null;
      zip_copy_leng = 0;
    }

    switch(zip_method) {
      case 0: // zip_STORED_BLOCK
      i = zip_inflate_stored(buff, off + n, size - n);
      break;

      case 1: // zip_STATIC_TREES
      if(zip_tl != null)
        i = zip_inflate_codes(buff, off + n, size - n);
      else
        i = zip_inflate_fixed(buff, off + n, size - n);
      break;

      case 2: // zip_DYN_TREES
      if(zip_tl != null)
        i = zip_inflate_codes(buff, off + n, size - n);
      else
        i = zip_inflate_dynamic(buff, off + n, size - n);
      break;

      default: // error
      i = -1;
      break;
    }

    if(i == -1) {
      if(zip_eof)
        return 0;
      return -1;
    }
    n += i;
  }
  return n;
}

var final_data = false;
var start_inflate = function(h) {
  final_data = false;
  zip_inflate_start();
  zip_inflate_pos = h.offset;
  h.computedCRC32 = 0;
}
var continue_inflate = function(str, h, onstream) {
  var i, j;
  var BUFSZ = 4096;
  zip_inflate_data = str;
  if (!final_data && str.length <= zip_inflate_pos+BUFSZ+64)
    return h;

  var buff = new Array(BUFSZ);
  while((i = zip_inflate_internal(buff, 0, buff.length)) > 0) {
    var cbuf = new Array(i);
    for(j = 0; j < i; j++){
      cbuf[j] = String.fromCharCode(buff[j]);
    }
    var s = cbuf.join("");
    h.data.push(s);
    h.outputSize += s.length;
    h.offset = zip_inflate_pos;
    h.computedCRC32 = Bin.CRC32(s, 0, s.length, h.computedCRC32);
    if (!final_data && str.length <= zip_inflate_pos+BUFSZ+64)
      break;
  }
  zip_inflate_data = null; // G.C.
  if (onstream) onstream(h);
  return h;
}
var final_inflate = function(str, h, onstream) {
  final_data = true;
  continue_inflate(str, h, onstream);
}

this.inflate = function(str,h,onstream) {
  start_inflate(h);
  return final_inflate(str,h,onstream);
};
this.start_inflate = start_inflate;
this.continue_inflate = continue_inflate;
this.final_inflate = final_inflate;
});
