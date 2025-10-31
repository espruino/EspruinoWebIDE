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

  function showUploadFileDialog(options) {
    Espruino.Core.Utils.fileOpenDialog({
        id:"storage",
        type:"text",
        multi:true
        // mineType : anything
      },function(contents, mimeType, fileName) {
      var contentsToUpload = contents;
      var imageTypes = ['image/gif', 'image/jpeg', 'image/png'];
      var audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac'];
      var isImage = imageTypes.includes(mimeType);
      var isAudio = audioTypes.includes(mimeType);
      var html = `<div>
      <p>Uploading <span id="ressize">${contents.length}</span> bytes to Storage.</p>
      <label for="filename">Filename (max ${MAX_FILENAME_LEN} chars)</label><br/>
      <input name="filename" class="filenameinput" type="text" maxlength="${MAX_FILENAME_LEN}" style="border: 2px solid #ccc;" value="${Espruino.Core.Utils.escapeHTML(fileName.substr(0,MAX_FILENAME_LEN))}"></input>
      `;
      if (isImage) {
        html += `<p>The file you uploaded is an image...</p>
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
      } else if (isAudio) {
         html += `<p>The file you uploaded is audio...</p>
        <input type="checkbox" id="convert" checked>Convert for Espruino</input><br/>
        <div id="audiooptions">
        If converted, the file will be 8 bit, unsigned raw data that can be used with the <code>Waveform</code> class.<br/>
        Sample Rate: <input type="number" id="samplerate" min="1000" max="32000" value="4000"></input><br/>
        <br/>
        <div id="status"></div>
        </div>
        `;
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
      if (isImage) {
        var controls = {
          convert : popup.window.querySelector("#convert"),
          optionsdiv : popup.window.querySelector("#imageoptions"),
          transparent : popup.window.querySelector("#transparent"),
          inverted : popup.window.querySelector("#inverted"),
          autoCrop : popup.window.querySelector("#autoCrop"),
          diffusion : popup.window.querySelector("#diffusion"),
          brightness : popup.window.querySelector("#brightness"),
          contrast : popup.window.querySelector("#contrast"),
          colorStyle : popup.window.querySelector("#colorStyle"),
          canvas1 : popup.window.querySelector("#canvas1"),
          canvas2 : popup.window.querySelector("#canvas2"),
          ressize : popup.window.querySelector("#ressize")
        };
        imageconverter.setFormatOptions(controls.colorStyle);
        imageconverter.setDiffusionOptions(controls.diffusion);
        controls.convert.addEventListener("change", recalculateImage);
        controls.transparent.addEventListener("change", recalculateImage);
        controls.inverted.addEventListener("change", recalculateImage);
        controls.autoCrop.addEventListener("change", recalculateImage);
        controls.diffusion.addEventListener("change", recalculateImage);
        controls.brightness.addEventListener("change", recalculateImage);
        controls.contrast.addEventListener("change", recalculateImage);
        controls.colorStyle.addEventListener("change", recalculateImage);

        var img;
        function recalculateImage() {
          var convert = controls.convert.checked;
          if (!convert || (img === undefined)) {
            contentsToUpload = contents;
            controls.optionsdiv.style = "display:none;";
          } else {
            controls.optionsdiv.style = "display:block;";

            var options = {};
            options.output = "raw";
            options.diffusion = controls.diffusion.options[controls.diffusion.selectedIndex].value;
            options.compression = false;
            options.transparent = controls.transparent.checked;
            options.inverted = document.getElementById("inverted").checked;
            options.autoCrop = controls.autoCrop.checked;
            options.brightness = 0|controls.brightness.value;
            options.contrast = 0|controls.contrast.value;
            options.mode = controls.colorStyle.options[controls.colorStyle.selectedIndex].value;

            controls.canvas1.width = img.width;
            controls.canvas1.height = img.height;
            controls.canvas1.style = "display:block;border:1px solid black;margin:8px;"
            var ctx1 = canvas1.getContext("2d");
            ctx1.drawImage(img,0,0);

            var imageData = ctx1.getImageData(0, 0, img.width, img.height);
            var rgba = imageData.data;
            options.rgbaOut = rgba;
            options.width = img.width;
            options.height = img.height;
            contentsToUpload = imageconverter.RGBAtoString(rgba, options);

            controls.canvas2.width = options.width;
            controls.canvas2.height = options.height;
            controls.canvas2.style = "display:block;border:1px solid black;margin:8px;"
            var ctx2 = canvas2.getContext("2d");
            ctx2.fillStyle = 'white';
            ctx2.fillRect(options.width, 0, options.width, options.height);
            var outputImageData = new ImageData(options.rgbaOut, options.width, options.height);
            ctx2.putImageData(outputImageData,0,0);

            // checkerboard for transparency on original image
            var imageData = ctx1.getImageData(0, 0, img.width, img.height);
            imageconverter.RGBAtoCheckerboard(imageData.data, {width:img.width,height:img.height});
            ctx1.putImageData(imageData,0,0);
          }

          controls.ressize.innerHTML = contentsToUpload.length+" Bytes";
        }
        img = new Image();
        img.onload = recalculateImage;
        img.src = "data:"+mimeType+";base64,"+Espruino.Core.Utils.btoa(contents);
      } else if (isAudio) {
        var controls = {
          convert : popup.window.querySelector("#convert"),
          optionsdiv : popup.window.querySelector("#audiooptions"),
          samplerate : popup.window.querySelector("#samplerate"),
          status : popup.window.querySelector("#status"),
          ressize : popup.window.querySelector("#ressize")
        }
        controls.convert.addEventListener("change", recalculateAudio);
        controls.samplerate.addEventListener("change", recalculateAudio);

        function recalculateAudio() {
          var convert = controls.convert.checked;
          if (!convert) {
            contentsToUpload = contents;
            controls.optionsdiv.style = "display:none;";
          } else {
            controls.optionsdiv.style = "display:block;";
            const SAMPLERATE = 0|controls.samplerate.value;
            const offlineAudioContext = new OfflineAudioContext(1, SAMPLERATE*10/*buffer length*/, SAMPLERATE);
            const wavArray = new Uint8Array(contents.length);
            for (let i = 0; i < contents.length; i++)
              wavArray[i] = contents.charCodeAt(i);
            offlineAudioContext.decodeAudioData(wavArray.buffer)
              .then(audioBuffer => {
                const bufferLength = audioBuffer.length;
                const numberOfChannels = audioBuffer.numberOfChannels;
                // Get the PCM data from the audio buffer
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
                contentsToUpload = wavContents;
                controls.ressize.innerHTML = contentsToUpload.length+" Bytes";
                controls.status.innerText = `Encoded to: ${(length/SAMPLERATE).toFixed(1)} sec, ${wavContents.length} bytes` + (isTruncated?" (TRUNCATED!)":"");
              }, error => {
                console.error('Error decoding audio data:', error);
              });
          }
        }
        recalculateAudio();
      }
    });
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
