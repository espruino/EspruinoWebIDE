/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  A plugin to handle uploading and downloading files from storage
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  /// Chunk size the files are downloaded in
  var CHUNKSIZE = 384;// or any multiple of 96 for atob/btoa
  var MAX_FILENAME_LEN = 28; // 28 on 2v05 and newer, 8 on 2v04 and older
  var STORAGEFILE_POSTFIX = " (StorageFile)";
  var iconSDCard;

  function init() {
    Espruino.Core.Config.add("SHOW_SDCARD_ICON", {
      section : "Communications",
      name : "SD Card (fs) Support",
      description : "Show an icon that allows you to access files on an SD Card (if your device supports it)",
      type : "boolean",
      defaultValue : false,
      onChange : function(newValue) { showSDCardIcon(newValue); }
    });
    Espruino.Core.App.addIcon({
      id: "storage",
      icon: "storage",
      title : "Access files in device's storage",
      order: 300,
      area: {
        name: "code",
        position: "top"
      },
      click: function() {
        Espruino.Core.MenuPortSelector.ensureConnected(function() {
          showStorage({});
        });
      }
    });
    showSDCardIcon(Espruino.Config.SHOW_SDCARD_ICON);
  }

  function showSDCardIcon(show) {
    if (show) {
      iconSDCard = Espruino.Core.App.addIcon({
        id: "storage",
        icon: "sdcard",
        title : "Access files on SD Card",
        order: 300,
        area: {
          name: "code",
          position: "top"
        },
        click: function() {
          Espruino.Core.MenuPortSelector.ensureConnected(function() {
            showStorage({fs:1});
          });
        }
      });
    } else {
      if (iconSDCard!==undefined) {
        iconSDCard.remove();
        iconSDCard = undefined;
      }
    }
  }

  function getTitle(options) {
    if (options && options.fs==1)
      return "SD Card";
    return "Device Storage";
  }

  function formatFilename(fileName) {
    if (!Espruino.Core.Utils.isASCII(fileName))
      return JSON.stringify(fileName);
    return fileName;
  }

  /// Get the file path when writing to fs
  function getFSFilePath(options, fileName) {
    if (options.dir && options.dir.length>0)
      return options.dir+"/"+fileName;
    return fileName;
  }

  function downloadFile(options, fileName, callback) {
    Espruino.Core.Status.showStatusWindow(getTitle(options), "Downloading "+JSON.stringify(getFSFilePath(options, fileName)));
    // if it was a storagefile, remove the last char - downloadFile will work it out automatically
    if (fileName.endsWith(STORAGEFILE_POSTFIX)) {
      fileName = fileName.substr(0, fileName.length-STORAGEFILE_POSTFIX.length);
    }
    Espruino.Core.Utils.downloadFile(getFSFilePath(options, fileName), function(contents) {
      Espruino.Core.Status.hideStatusWindow();
      if (contents===undefined)
        return Espruino.Core.Notifications.error("Timed out receiving file")
      callback(contents);
    }, {fs:options.fs});
  }

  function uploadFile(options, fileName, contents, callback) {
    Espruino.Core.Status.showStatusWindow(getTitle(options), "Uploading "+JSON.stringify(getFSFilePath(options, fileName)));
    Espruino.Core.Utils.uploadFile(getFSFilePath(options, fileName), contents, function() {
      Espruino.Core.Status.hideStatusWindow();
      callback();
    }, {fs:options.fs});
  }

  function deleteFile(options, fileName, callback) {
    if (options.fs) {
      Espruino.Core.Utils.executeStatement(`require("fs").unlink(${JSON.stringify(getFSFilePath(options, fileName))})\n`, callback);
    } else if (fileName.endsWith(STORAGEFILE_POSTFIX)) {
      fileName = fileName.substr(0, fileName.length-STORAGEFILE_POSTFIX.length);
      Espruino.Core.Utils.executeStatement(`require("Storage").open(${JSON.stringify(fileName)},"r").erase()\n`, callback);
    } else {
      Espruino.Core.Utils.executeStatement(`require("Storage").erase(${JSON.stringify(fileName)})\n`, callback);
    }
  }

  function getFileList(options, callback) {
    //callback([{fn:'"a"'},{fn:'"b"'},...]);
    // and d:0/1 for SD card if a directory
    let cmd = options.fs ?
      `require('fs').readdirSync(${options.dir?JSON.stringify(options.dir):""}).forEach(x=>{ if (x!="." && x!="..") print(JSON.stringify({fn:x,d:0|require("fs").statSync(${options.dir?JSON.stringify(options.dir+"/")+"+":""}x).dir}))});` :
      `require('Storage').list().forEach(x=>print(JSON.stringify({fn:x})));`
    Espruino.Core.Utils.executeStatement(cmd, function(files) {
      var fileList = [];
      try {
        fileList = Espruino.Core.Utils.parseJSONish("["+files.trim().replace(/\n/g,",")+"]");
        fileList.sort((a,b) => {
          if (a.d != b.d) return (0|b.d) - (0|a.d); // dirs first
          let afn = a.fn.toLowerCase();
          let bfn = b.fn.toLowerCase();
          if (afn<bfn) return -1;
          if (afn>bfn) return 1;
          return 0;
        });
        // fileList.sort(); // ideally should ignore first char for sorting
      } catch (e) {
        console.log("getFileList",e);
        fileList = [];
      }
      callback(fileList);
    });
  }

  /// Just dump the given data as hex
  function decodeHexDump(data) {
    var hexdump = "";
    var len = 16;
    for (var a=0;a<data.length;a+=len) {
      var s = data.substr(a,len);
      var line = ("00000000"+a.toString(16)).substr(-8)+": ";
      var i;
      for (i=0;i<s.length;i++)
        line +=  ("0"+s.charCodeAt(i).toString(16)).substr(-2)+" "
      for (;i<len;i++)
        line += "   ";
      for (i=0;i<s.length;i++) {
        var c = s.charCodeAt(i);
        if (c>=32 && c<128) line += s[i];
        else line += ".";
      }
      hexdump += line+"\n";
    }
    return hexdump;
  }

  /**
   * Create an image converter popup
   * @param {*} contents Image data contents
   * @param {*} mimeType MIME type of the image
   * @param {*} fileName Name of the image file
   * @param {*} callback Callback function to receive converted image data
   * @returns {Object} Converter object with setup and getHTML functions
   */
  function createImageConverter(contents, mimeType, fileName, callback) {
    var converter = {
      html: '',
      controls: null,
      img: null,
      originalContents: contents,
      convertedContents: contents,
      
      setup: function(popup) {
        this.controls = {
          convert: popup.window.querySelector("#convert"),
          optionsdiv: popup.window.querySelector("#imageoptions"),
          transparent: popup.window.querySelector("#transparent"),
          inverted: popup.window.querySelector("#inverted"),
          autoCrop: popup.window.querySelector("#autoCrop"),
          diffusion: popup.window.querySelector("#diffusion"),
          brightness: popup.window.querySelector("#brightness"),
          contrast: popup.window.querySelector("#contrast"),
          colorStyle: popup.window.querySelector("#colorStyle"),
          canvas1: popup.window.querySelector("#canvas1"),
          canvas2: popup.window.querySelector("#canvas2")
        };
        
        imageconverter.setFormatOptions(this.controls.colorStyle);
        imageconverter.setDiffusionOptions(this.controls.diffusion);
        
        var self = this;
        this.controls.convert.addEventListener("change", function() { self.recalculate(); });
        this.controls.transparent.addEventListener("change", function() { self.recalculate(); });
        this.controls.inverted.addEventListener("change", function() { self.recalculate(); });
        this.controls.autoCrop.addEventListener("change", function() { self.recalculate(); });
        this.controls.diffusion.addEventListener("change", function() { self.recalculate(); });
        this.controls.brightness.addEventListener("change", function() { self.recalculate(); });
        this.controls.contrast.addEventListener("change", function() { self.recalculate(); });
        this.controls.colorStyle.addEventListener("change", function() { self.recalculate(); });
        
        this.img = new Image();
        this.img.onload = function() { self.recalculate(); };
        this.img.src = "data:"+mimeType+";base64,"+Espruino.Core.Utils.btoa(contents);
      },
      
      recalculate: function() {
        var convert = this.controls.convert.checked;
        if (!convert || !this.img) {
          this.convertedContents = this.originalContents;
          this.controls.optionsdiv.style = "display:none;";
          if (callback) callback(this.convertedContents);
          return;
        }
        
        this.controls.optionsdiv.style = "display:block;";
        var opts = {
          output: "raw",
          diffusion: this.controls.diffusion.options[this.controls.diffusion.selectedIndex].value,
          compression: false,
          transparent: this.controls.transparent.checked,
          inverted: this.controls.inverted.checked,
          autoCrop: this.controls.autoCrop.checked,
          brightness: 0|this.controls.brightness.value,
          contrast: 0|this.controls.contrast.value,
          mode: this.controls.colorStyle.options[this.controls.colorStyle.selectedIndex].value
        };
        
        this.controls.canvas1.width = this.img.width;
        this.controls.canvas1.height = this.img.height;
        this.controls.canvas1.style = "display:block;border:1px solid black;margin:8px;";
        var ctx1 = this.controls.canvas1.getContext("2d");
        ctx1.drawImage(this.img, 0, 0);
        
        var imageData = ctx1.getImageData(0, 0, this.img.width, this.img.height);
        var rgba = imageData.data;
        opts.rgbaOut = rgba;
        opts.width = this.img.width;
        opts.height = this.img.height;
        this.convertedContents = imageconverter.RGBAtoString(rgba, opts);
        
        this.controls.canvas2.width = opts.width;
        this.controls.canvas2.height = opts.height;
        this.controls.canvas2.style = "display:block;border:1px solid black;margin:8px;";
        var ctx2 = this.controls.canvas2.getContext("2d");
        ctx2.fillStyle = 'white';
        ctx2.fillRect(opts.width, 0, opts.width, opts.height);
        var outputImageData = new ImageData(opts.rgbaOut, opts.width, opts.height);
        ctx2.putImageData(outputImageData, 0, 0);
        
        // checkerboard for transparency on original image
        imageData = ctx1.getImageData(0, 0, this.img.width, this.img.height);
        imageconverter.RGBAtoCheckerboard(imageData.data, {width:this.img.width, height:this.img.height});
        ctx1.putImageData(imageData, 0, 0);
        
        if (callback) callback(this.convertedContents);
      },
      
      getHTML: function() {
        return `<p>The file you uploaded is an image...</p>
        <input type="checkbox" id="convert" checked>Convert for Espruino</input><br/>
        <div id="imageoptions">
        <input type="checkbox" id="transparent" checked>Transparency?</input><br/>
        <input type="checkbox" id="inverted">Inverted?</input><br/>
        <input type="checkbox" id="autoCrop">Crop?</input><br/>
        Colours: <select id="colorStyle"></select><br/>
        Diffusion: <select id="diffusion"></select><br/>
        Brightness:<input type="range" id="brightness" min="-127" max="127" value="0"></input><br/>
        Contrast:<input type="range" id="contrast" min="-255" max="255" value="0"></input><br/>

        <table width="100%">
        <tr><th>Original</th>
            <th>Converted</th></tr>
        <tr><td><canvas id="canvas1" style="display:none;"></canvas></td>
            <td><canvas id="canvas2" style="display:none;"></canvas></td>
        </tr></table>
        </div>
        `;
      }
    };
    
    return converter;
  }

  /**
   * Create an audio converter popup
   * @param {*} contents Audio data contents
   * @param {*} mimeType MIME type of the audio
   * @param {*} fileName Name of the audio file
   * @param {*} callback Callback function to receive converted audio data
   * @returns {Object} Converter object with setup and getHTML functions
   */
  function createAudioConverter(contents, mimeType, fileName, callback) {
    var converter = {
      html: '',
      controls: null,
      originalContents: contents,
      convertedContents: contents,
      
      setup: function(popup) {
        this.controls = {
          convert: popup.window.querySelector("#convert"),
          optionsdiv: popup.window.querySelector("#audiooptions"),
          samplerate: popup.window.querySelector("#samplerate"),
          status: popup.window.querySelector("#status")
        };
        
        var self = this;
        this.controls.convert.addEventListener("change", function() { self.recalculate(); });
        this.controls.samplerate.addEventListener("change", function() { self.recalculate(); });
        this.recalculate();
      },
      
      recalculate: function() {
        var convert = this.controls.convert.checked;
        if (!convert) {
          this.convertedContents = this.originalContents;
          this.controls.optionsdiv.style = "display:none;";
          if (callback) callback(this.convertedContents);
          return;
        }
        
        this.controls.optionsdiv.style = "display:block;";
        const SAMPLERATE = 0|this.controls.samplerate.value;
        const offlineAudioContext = new OfflineAudioContext(1, SAMPLERATE*10/*buffer length*/, SAMPLERATE);
        const wavArray = new Uint8Array(this.originalContents.length);
        for (let i = 0; i < this.originalContents.length; i++)
          wavArray[i] = this.originalContents.charCodeAt(i);
        
        var self = this;
        offlineAudioContext.decodeAudioData(wavArray.buffer)
          .then(audioBuffer => {
            const bufferLength = audioBuffer.length;
            const numberOfChannels = audioBuffer.numberOfChannels;
            // Get PCM data from the audio buffer
            const pcmData = new Float32Array(bufferLength);
            audioBuffer.copyFromChannel(pcmData, 0, 0); // copy from first channel only
            // TODO: could average channels?
            // convert it to 8 bit format and append
            let wavContents = "";
            let length = Math.min(pcmData.length, SAMPLERATE*30); // max 30 seconds!!
            let isTruncated = length!=pcmData.length;
            for (let i = 0; i < length; i++) {
              var v = 128+Math.round(pcmData[i] * 127);
              if (v<0) v=0;
              if (v>255) v=255;
              wavContents += String.fromCharCode(v);
            }
            self.convertedContents = wavContents;
            self.controls.status.innerText = `Encoded to: ${(length/SAMPLERATE).toFixed(1)} sec, ${wavContents.length} bytes` + (isTruncated?" (TRUNCATED!)":"");
            if (callback) callback(self.convertedContents);
          }, error => {
            console.error('Error decoding audio data:', error);
          });
      },
      
      getHTML: function() {
        return `<p>The file you uploaded is audio...</p>
        <input type="checkbox" id="convert" checked>Convert for Espruino</input><br/>
        <div id="audiooptions">
        If converted, the file will be 8 bit, unsigned raw data that can be used with the <code>Waveform</code> class.<br/>
        Sample Rate: <input type="number" id="samplerate" min="1000" max="32000" value="4000"></input><br/>
        <br/>
        <div id="status"></div>
        </div>
        `;
      }
    };
    
    return converter;
  }

  /**
   * Show batch upload dialog
   * @param {*} options Upload options
   * @param {*} files Array of files to upload
   */
  function showBatchUploadDialog(options, files) {

    var fileList = files.map(function(file) {
      return {
        sourceFile: file,
        targetName: file.fileName.substr(0, MAX_FILENAME_LEN),
        shouldEvaluate: false,
        shouldUpload: true,
        converter: null,
        convertedContents: file.contents
      };
    });

    // Sort uploaded files by their filename
    fileList.sort(function(a,b){
      var A = (a && a.sourceFile && a.sourceFile.fileName) ? a.sourceFile.fileName.toLowerCase() : "";
      var B = (b && b.sourceFile && b.sourceFile.fileName) ? b.sourceFile.fileName.toLowerCase() : "";
      if (A < B) return -1;
      if (A > B) return 1;
      return 0;
    });
    
    // Build UI
    var html = '<div style="max-height:400px;overflow-y:auto;"><table style="width:100%;"><tr><th>Upload?</th><th>Source File</th><th>Target Name</th><th>Size</th><th>Convert</th></tr>';
    fileList.forEach(function(item, idx) {
      var isImage = ['image/gif','image/jpeg','image/png'].includes(item.sourceFile.mimeType);
      var isAudio = ['audio/mpeg','audio/wav','audio/ogg','audio/aac'].includes(item.sourceFile.mimeType);
      if (isImage || isAudio) item.mustConvert = true; else item.mustConvert = false;
      item.convertedDone = !item.mustConvert; // if not media, already done
      html += '<tr>';
      html += '<td style="text-align:center;"><input type="checkbox" class="upload-check" data-idx="'+idx+'" '+(item.shouldUpload?'checked':'')+'/></td>';
      html += '<td>'+Espruino.Core.Utils.escapeHTML(item.sourceFile.fileName)+'</td>';
      html += '<td><input type="text" class="target-name" data-idx="'+idx+'" maxlength="'+MAX_FILENAME_LEN+'" value="'+Espruino.Core.Utils.escapeHTML(item.targetName)+'" style="width:100%;"/></td>';
      html += '<td style="text-align:right;font-family:monospace;">'+item.sourceFile.contents.length+'&nbsp;B</td>';
      if (item.mustConvert)
        html += '<td style="white-space:nowrap;"><button class="btn convert-btn" data-idx="'+idx+'">Convert...</button><span class="conv-status" data-idx="'+idx+'" style="margin-left:6px;color:#c00;">Pending</span></td>';
      else
        html += '<td>-</td>';
      html += '</tr>';
    });
    html += '</table></div>';
    
    var popup = Espruino.Core.App.openPopup({
      id: "storagebatchupload",
      title: "Upload Files to Storage",
      padding: true,
      contents: html,
      position: "auto",
      buttons: [{ name:"Upload", callback: function() {
        // Gather selected files
        var toUpload = [];
        popup.window.querySelectorAll('.upload-check').forEach(function(cb) {
          if (cb.checked) {
            var idx = parseInt(cb.getAttribute('data-idx'));
            var targetInput = popup.window.querySelector('.target-name[data-idx="'+idx+'"]');
            fileList[idx].targetName = targetInput.value;
            if (fileList[idx].targetName.length > 0 && fileList[idx].targetName.length <= MAX_FILENAME_LEN) {
              toUpload.push(fileList[idx]);
            }
          }
        });
        
        if (toUpload.length === 0) {
          Espruino.Core.Notifications.warning("No files selected");
          return;
        }

        // Check for duplicate target filenames
        var seenNames = new Set();
        var duplicates = [];
        for (var i = 0; i < toUpload.length; i++) {
          var name = toUpload[i].targetName.toLowerCase();
          if (seenNames.has(name)) {
            duplicates.push(toUpload[i].targetName);
          } else {
            seenNames.add(name);
          }
        }
        if (duplicates.length > 0) {
          Espruino.Core.Notifications.error("Duplicate target filenames: "+duplicates.join(', '));
          return;
        }

        // Ensure all conversions completed
        var incomplete = toUpload.filter(f=>f.mustConvert && !f.convertedDone);
        if (incomplete.length) {
          Espruino.Core.Notifications.error("You must convert: "+incomplete.map(f=>f.sourceFile.fileName).join(', '));
          return;
        }
        
        popup.close();
        uploadBatchFiles(options, toUpload);
      }}, { name:"Cancel", callback: function() { popup.close(); }}]
    });

    // Conversion popup logic
    function openConversion(itemIdx) {
      var item = fileList[itemIdx];
      var isImage = ['image/gif','image/jpeg','image/png'].includes(item.sourceFile.mimeType);
      var isAudio = ['audio/mpeg','audio/wav','audio/ogg','audio/aac'].includes(item.sourceFile.mimeType);
      var converter = isImage ? createImageConverter(item.sourceFile.contents, item.sourceFile.mimeType, item.sourceFile.fileName, function(converted){ item.convertedContents = converted; }) :
                     isAudio ? createAudioConverter(item.sourceFile.contents, item.sourceFile.mimeType, item.sourceFile.fileName, function(converted){ item.convertedContents = converted; }) : null;
      var html = '<div><h3>Convert '+Espruino.Core.Utils.escapeHTML(item.sourceFile.fileName)+'</h3>';
      html += '<p>Adjust options then click Apply. Uncheck "Convert for Espruino" to keep original data.</p>';
      if (converter) html += converter.getHTML();
      html += '</div>';
      var cv = Espruino.Core.App.openPopup({
        id:"storageconvertitem",
        title:"Media Conversion",
        padding:true,
        contents:html,
        position:"auto",
        buttons:[{name:"Apply", callback:function(){
          item.convertedDone = true; // mark complete
          var statusEl = popup.window.querySelector('.conv-status[data-idx="'+itemIdx+'"]');
          if (statusEl) { statusEl.innerHTML = 'Ready'; statusEl.style.color = '#090'; }
          cv.close();
        }},{name:"Cancel", callback:function(){ cv.close(); }}]
      });
      if (converter) converter.setup(cv);
    }
    popup.window.querySelectorAll('.convert-btn').forEach(btn => {
      btn.addEventListener('click', function(){ openConversion(parseInt(btn.getAttribute('data-idx'))); });
    });
  }

  /**
   * Upload multiple files in sequence
   * @param {*} options 
   * @param {*} fileList 
   * @param {*} onComplete 
   */
  function uploadBatchFiles(options, fileList, onComplete) {
    var currentIndex = 0;
    var totalFiles = fileList.length;

    function startUploads() {
      uploadNext();
    }

    function uploadNext() {
      if (currentIndex >= totalFiles) {
        Espruino.Core.Status.setStatus("All files uploaded!");
        setTimeout(function() { Espruino.Core.Status.setStatus(""); }, 2000);
        if (typeof onComplete === 'function') { try { onComplete(); } catch (e) { console.warn(e); } }
        return;
      }
      
      var item = fileList[currentIndex];
      currentIndex++;
      
      Espruino.Core.Status.setStatus("Uploading " + currentIndex + " of " + totalFiles + ": " + item.targetName);

      uploadFile(options, item.targetName, item.convertedContents, function() {
        console.log("Uploaded: " + item.targetName);
        uploadNext();
      });
    }

    startUploads();
  }

  /**
   * Show file open dialog for uploading files
   * @param {*} options 
   */
  function showUploadFileDialog(options) {
    // Request arraybuffer -- easier to convert to binary string later
    Espruino.Core.Utils.fileOpenDialog({
        id:"storage",
        type:"arraybuffer",
        multi:true,
        onComplete: function(files) {
          if (!files || files.length === 0) return;

          // Convert ArrayBuffers to binary-string
          files.forEach(function(f) {
            if (f && f.contents && f.contents instanceof ArrayBuffer) {
              f.contents = arrayBufferToBinaryString(f.contents);
            }
          });

          // If multiple files, use new batch upload
          if (files.length > 1) {
            showBatchUploadDialog(options, files);
          } else {
            var file = files[0];
            showSingleFileUploadDialog(options, file.contents, file.mimeType, file.fileName);
          }
        }
      });
  }

  // Helper to convert an ArrayBuffer to a binary string
  function arrayBufferToBinaryString(buffer) {
    var bytes = new Uint8Array(buffer);
    var s = "";
    for (var i=0;i<bytes.length;i++) s += String.fromCharCode(bytes[i]);
    return s;
  }

  /**
   * Show single file upload dialog
   * @param {*} options 
   * @param {*} contents 
   * @param {*} mimeType 
   * @param {*} fileName 
   */
  function showSingleFileUploadDialog(options, contents, mimeType, fileName) {
      var imageTypes = ['image/gif', 'image/jpeg', 'image/png'];
      var audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac'];
      var isImage = imageTypes.includes(mimeType);
      var isAudio = audioTypes.includes(mimeType);
      
      var imageConverter = null;
      var audioConverter = null;
      var contentsToUpload = contents;
      
      var html = `<div>
      <p>Uploading <span id="ressize">${contents.length}</span> bytes to Storage.</p>
      <label for="filename">Filename (max ${MAX_FILENAME_LEN} chars)</label><br/>
      <input name="filename" class="filenameinput" type="text" maxlength="${MAX_FILENAME_LEN}" style="border: 2px solid #ccc;" value="${Espruino.Core.Utils.escapeHTML(fileName.substr(0,MAX_FILENAME_LEN))}"></input>
      `;
      
      if (isImage) {
        imageConverter = createImageConverter(contents, mimeType, fileName, function(converted) {
          contentsToUpload = converted;
          if (popup && popup.window) {
            var ressize = popup.window.querySelector("#ressize");
            if (ressize) ressize.innerHTML = converted.length + " Bytes";
          }
        });
        html += imageConverter.getHTML();
      } else if (isAudio) {
        audioConverter = createAudioConverter(contents, mimeType, fileName, function(converted) {
          contentsToUpload = converted;
          if (popup && popup.window) {
            var ressize = popup.window.querySelector("#ressize");
            if (ressize) ressize.innerHTML = converted.length + " Bytes";
          }
        });
        html += audioConverter.getHTML();
      }
      html += `</div>`;

      var popup = Espruino.Core.App.openPopup({
        id: "storagefileupload",
        title: "Upload a file",
        padding: true,
        contents: html,
        position: "auto",
        buttons : [{ name:"Ok", callback : function() {
          var filename = popup.window.querySelector(".filenameinput").value;
          if (!filename.length) {
            Espruino.Core.Notifications.error("You must supply a filename")
            return;
          }
          if (filename.length>MAX_FILENAME_LEN) {
            Espruino.Core.Notifications.error("Filename greater than "+MAX_FILENAME_LEN+" characters")
            return;
          }
          console.log("Write file to Storage as "+JSON.stringify(filename));
          uploadFile(options, filename, contentsToUpload, function() {
            console.log("Upload complete!");
          });
          popup.close();
        }}, { name:"Cancel", callback : function() { popup.close(); }}]
      });
      popup.window.querySelector(".filenameinput").focus();
      
      if (isImage && imageConverter) {
        imageConverter.setup(popup);
      } else if (isAudio && audioConverter) {
        audioConverter.setup(popup);
      }
  }

  function showViewFileDialog(options, fileName, contents, wasDecoded) {
    console.log("View",fileName);
    var buttons = [{ name:"Ok", callback : function() { popup.close(); }}];
    var html;
    if (Espruino.Core.Utils.isASCII(contents) || wasDecoded) {
      html = '<div style="overflow-y:auto;font-family: monospace;">'+
        Espruino.Core.Utils.escapeHTML(contents).replace(/\n/g,"<br>")+'</div>';
        buttons.push({ name:"Copy to Editor", callback : function() {
          Espruino.Core.File.setJSCode(contents, {fileName: fileName, isStorageFile: true});
          popup.close();
        }});
    } else {
      var img = imageconverter.stringToImageHTML(contents,{transparent:false});
      if (img) { // it's a valid image
        html = '<div style="text-align:center;padding-top:10px;min-width:200px;">'+
                '<a href="'+imageconverter.stringToImageURL(contents,{transparent:true})+'" download="image.png">'+
                img+'</a></div>';
      } else {
        html = '<div style="overflow:auto;font-family: monospace;">'+
          Espruino.Core.Utils.escapeHTML(decodeHexDump(contents)).replace(/\n/g,"<br>")+'</div>';
        if (fileName.startsWith(".boot") || fileName.endsWith(".js") ||
            Espruino.Plugins.Pretokenise.isTokenised(contents)) {
          buttons.push({ name:"Decode JS", callback : function() {
            popup.close();
            showViewFileDialog(options, fileName, Espruino.Plugins.Pretokenise.untokenise(contents), true);
          }});
        }
      }
    }
    buttons.push({ name:"Save", callback : function() {
      popup.close();
      Espruino.Core.Utils.fileSaveDialog(contents, fileName);
    }});
    var popup = Espruino.Core.App.openPopup({
      id: "storagefileview",
      title: "Contents of "+formatFilename(fileName),
      padding: true,
      contents: html,
      position: "auto",
      buttons : buttons
    });
    }

  function showDeleteFileDialog(options, fileName) {
    var popup = Espruino.Core.App.openPopup({
      id: "storagefiledelete",
      title: "Really remove "+formatFilename(fileName)+"?",
      padding: true,
      contents: "Do you really want to remove this file?",
      position: "auto",
      buttons : [{ name:"Yes", callback : function() {
        deleteFile(options, fileName, function() {
          Espruino.Core.Status.setStatus("File deleted.");
          showStorage(options);
        });
        popup.close();
      }},{ name:"No", callback : function() { popup.close(); }}]
    });
  }

  function showStorage(options) {
    var popup = Espruino.Core.App.openPopup({
      id: "storage",
      title: getTitle(options),
      padding: false,
      contents: Espruino.Core.HTML.htmlLoading(),
      position: "auto",
    });
    getFileList(options, function(fileList) {
      var items = [{
        title: "Upload files",
        icon : "icon-folder-open",
        callback : function() {
          popup.close();
          showUploadFileDialog(options);
        }
      }];
      if (!options.fs) items.push({
        title : "Download from RAM",
        right: [{ title:"View", icon:"icon-eye",
          callback : function() { // view the file
            Espruino.Core.Utils.executeStatement(`dump();`, function(contents) {
              showViewFileDialog(options, "RAM", contents);
            });
          }
        },{ title:"Save", icon:"icon-save",
          callback : function() { // Save the file
            Espruino.Core.Utils.executeStatement(`dump();`, function(contents) {
              Espruino.Core.Utils.fileSaveDialog(contents, "espruino.js");
            });
          }
        }]
      });

      fileList.filter(file=>{
        return file.fn.endsWith("\u0001");
      }).forEach(file=>{
        var prefix = file.fn.slice(0,-1);
        console.log("Found StorageFile "+prefix);
        // filter out any files with the same name
        fileList = fileList.filter(f=>f.fn.slice(0,-1) != prefix);
        // Add our new file at the end
        fileList.push({fn:prefix+STORAGEFILE_POSTFIX});
      });

      fileList.forEach(function(file) {
        items.push({
          title : formatFilename(file.fn),
          right: file.d ? [{ title:"Enter Subfolder", icon:"icon-folder",
            callback : function() { // view the file
              var o = Object.assign({}, options);
              o.dir = (o.dir?o.dir+"/":"")+file.fn;
              showStorage(o);
            }
          }] : [{ title:"View", icon:"icon-eye",
            callback : function() { // view the file
              downloadFile(options, file.fn, function(contents) {
                showViewFileDialog(options, file.fn, contents);
              });
            }
          },{ title:"Run file", icon:"icon-debug-go",
            callback : function() { // Save the file
              popup.close();
              Espruino.Core.Serial.write(`\x03\x10load(${JSON.stringify(file.fn)})\n`, false, function() {
                Espruino.Core.Notifications.success(`${JSON.stringify(file.fn)} loaded`, true);
              });
            }
          },{ title:"Save", icon:"icon-save",
            callback : function() { // Save the file
              downloadFile(options, file.fn, function(contents) {
                Espruino.Core.Utils.fileSaveDialog(contents, file.fn);
              });
            }
          },{ title:"Delete", icon:"icon-bin",
            callback : function() { // Delete the file
              popup.close();
              showDeleteFileDialog(options, file.fn);
            }
          }]
        });
      });

      popup.setContents(Espruino.Core.HTML.domList(items));

    });
  }

  /** Pop up a file selector for files in Storage... Must be connected
  options = {
    title // title for window
    allowNew // add an option to type in a new filename
    fs // 0=Storage (default), 1=SD Card
    dir // if sd card, the directory
  }
  */
  function showFileChooser(options, callback) {
    var popup = Espruino.Core.App.openPopup({
      id: "storagefilechooser",
      title: options.title,
      padding: false,
      contents: Espruino.Core.HTML.htmlLoading(),
      position: "auto",
    });
    getFileList(options, function(fileList) {
      var items = [];

      if (options.allowNew) {
        items.push({
          title: "New file",
          icon : "icon-folder-open",
          callback : function() {
            popup.close();
            popup = Espruino.Core.App.openPopup({
              id: "storagefilenew",
              title: "New file",
              padding: true,
              contents: `<label for="filename">Filename (max ${MAX_FILENAME_LEN} chars)</label><br/>
              <input name="filename" class="filenameinput" type="text" maxlength="${MAX_FILENAME_LEN}" style="border: 2px solid #ccc;" value=""></input>`,
              position: "auto",
              buttons : [{ name:"Ok", callback : function() {
                var filename = popup.window.querySelector(".filenameinput").value;
                if (!filename.length) {
                  Espruino.Core.Notifications.error("You must supply a filename")
                  return;
                }
                if (filename.length>MAX_FILENAME_LEN) {
                  Espruino.Core.Notifications.error(`Filename greater than ${MAX_FILENAME_LEN} characters`)
                  return;
                }
                popup.close();
                callback(getFSFilePath(options, filename));
              }}, { name:"Cancel", callback : function() { popup.close(); }}]
            });
            popup.window.querySelector(".filenameinput").focus();
          }
        });
      }

      // filter out any 'StorageFile' files
      fileList.filter(file=>{
        return file.fn.endsWith("\u0001");
      }).forEach(file=>{
        var prefix = file.fn.slice(0,-1);
        fileList = fileList.filter(f=>f.fn.slice(0,-1) != prefix);
      });

      fileList.forEach(function(file) {
        items.push({
          title : formatFilename(file.fn),
          icon : file.d ? "icon-folder" : undefined,
          callback : function() {
            if (file.d) {
              popup.close();
              var o = Object.assign({}, options);
              o.dir = (o.dir?o.dir+"/":"")+file.fn;
              showFileChooser(o, callback);
            } else {
              popup.close();
              callback(getFSFilePath(options, file.fn));
            }
          }
        });
      });
      if (fileList.length==0) {
        items.push({
          title : "No files found",
          callback : function() {
            popup.close();
          }
        });
      }
      popup.setContents(Espruino.Core.HTML.domList(items));
    });
  }

  Espruino.Plugins.Storage = {
    init : init,
    showFileChooser : showFileChooser
  };
}());
