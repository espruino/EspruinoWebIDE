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

  function init() {
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
          showStorage();
        });
      }
    });
  }

  function formatFilename(fileName) {
    if (!Espruino.Core.Utils.isASCII(fileName))
      return JSON.stringify(fileName);
    return fileName;
  }

  function downloadFile(fileName, callback) {
    Espruino.Core.Status.showStatusWindow("Device Storage","Downloading "+JSON.stringify(fileName));
    // if it was a storagefile, remove the last char - downloadFile will work it out automatically
    if (fileName.endsWith(STORAGEFILE_POSTFIX)) {
      fileName = fileName.substr(0, fileName.length-STORAGEFILE_POSTFIX.length);
    }
    Espruino.Core.Utils.downloadFile(fileName, function(contents) {
      Espruino.Core.Status.hideStatusWindow();
      if (contents===undefined)
        return Espruino.Core.Notifications.error("Timed out receiving file")
      callback(contents);
    });
  }

  function uploadFile(fileName, contents, callback) {
    Espruino.Core.Status.showStatusWindow("Device Storage","Uploading "+JSON.stringify(fileName));
    Espruino.Core.Utils.uploadFile(fileName, contents, function() {
      Espruino.Core.Status.hideStatusWindow();
      callback();
    });
  }

  function deleteFile(fileName, callback) {
    if (fileName.endsWith(STORAGEFILE_POSTFIX)) {
      fileName = fileName.substr(0, fileName.length-STORAGEFILE_POSTFIX.length);
      Espruino.Core.Utils.executeStatement(`require("Storage").open(${JSON.stringify(fileName)},"r").erase()\n`, callback);
    } else {
      Espruino.Core.Utils.executeStatement(`require("Storage").erase(${JSON.stringify(fileName)})\n`, callback);
    }
  }

  function getFileList(callback) {
    //callback(['"a"','"b"','"c"']);

    Espruino.Core.Utils.executeStatement(`require('Storage').list().forEach(x=>print(JSON.stringify(x)));`, function(files) {
      var fileList = [];
      try {
        fileList = Espruino.Core.Utils.parseJSONish("["+files.trim().replace(/\n/g,",")+"]");
        fileList.sort();
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

  function showUploadFileDialog() {
    Espruino.Core.Utils.fileOpenDialog({
        id:"storage",
        type:"text"
        // mineType : anything
      },function(contents, mimeType, fileName) {
      var contentsToUpload = contents;
      var imageTypes = ['image/gif', 'image/jpeg', 'image/png'];
      var isImage = imageTypes.includes(mimeType);
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
          uploadFile(filename, contentsToUpload, function() {
            console.log("Upload complete!");
          });
          popup.close();
        }}, { name:"Cancel", callback : function() { popup.close(); }}]
      });
      popup.window.querySelector(".filenameinput").focus();
      if (isImage) {
        var controls = {
          convert : popup.window.querySelector("#convert"),
          imageoptionsdiv : popup.window.querySelector("#imageoptions"),
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
        controls.convert.addEventListener("change", recalculate);
        controls.transparent.addEventListener("change", recalculate);
        controls.inverted.addEventListener("change", recalculate);
        controls.autoCrop.addEventListener("change", recalculate);
        controls.diffusion.addEventListener("change", recalculate);
        controls.brightness.addEventListener("change", recalculate);
        controls.contrast.addEventListener("change", recalculate);
        controls.colorStyle.addEventListener("change", recalculate);

        var img;
        function recalculate() {
          var convert = controls.convert.checked;
          if (!convert || (img === undefined)) {
            contentsToUpload = contents;
            controls.imageoptionsdiv.style = "display:none;";
          } else {
            controls.imageoptionsdiv.style = "display:block;";

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
        img.onload = recalculate;
        img.src = "data:"+mimeType+";base64,"+Espruino.Core.Utils.btoa(contents);
      }
    });
  }

  function showViewFileDialog(fileName, contents) {
    console.log("View",fileName);
    var buttons = [{ name:"Ok", callback : function() { popup.close(); }}];
    var html;
    if (Espruino.Core.Utils.isASCII(contents)) {
      html = '<div style="overflow-y:auto;font-family: monospace;">'+
        Espruino.Core.Utils.escapeHTML(contents).replace(/\n/g,"<br>")+'</div>';
        buttons.push({ name:"Copy to Editor", callback : function() {
          Espruino.Core.EditorJavaScript.setCode(contents);
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

  function showDeleteFileDialog(fileName) {
    var popup = Espruino.Core.App.openPopup({
      id: "storagefiledelete",
      title: "Really remove "+formatFilename(fileName)+"?",
      padding: true,
      contents: "Do you really want to remove this file?",
      position: "auto",
      buttons : [{ name:"Yes", callback : function() {
        deleteFile(fileName, function() {
          Espruino.Core.Status.setStatus("File deleted.");
          showStorage();
        });
        popup.close();
      }},{ name:"No", callback : function() { popup.close(); }}]
    });
  }

  function showStorage() {
    var popup = Espruino.Core.App.openPopup({
      id: "storage",
      title: "Device Storage",
      padding: false,
      contents: Espruino.Core.HTML.htmlLoading(),
      position: "auto",
    });
    getFileList(function(fileList) {
      var items = [{
        title: "Upload a file",
        icon : "icon-folder-open",
        callback : function() {
          popup.close();
          showUploadFileDialog();
        }
      }, {
        title : "Download from RAM",
        right: [{ title:"View", icon:"icon-eye",
          callback : function() { // view the file
            Espruino.Core.Utils.executeStatement(`dump();`, function(contents) {
              showViewFileDialog("RAM", contents);
            });
          }
        },{ title:"Save", icon:"icon-save",
          callback : function() { // Save the file
            Espruino.Core.Utils.executeStatement(`dump();`, function(contents) {
              Espruino.Core.Utils.fileSaveDialog(contents, "espruino.js");
            });
          }
        }]
      }];

      fileList.filter(fileName=>{
        return fileName.endsWith("\u0001");
      }).forEach(fileName=>{
        var prefix = fileName.slice(0,-1);
        console.log("Found StorageFile "+prefix);
        // filter out any files with the same name
        fileList = fileList.filter(f=>f.slice(0,-1) != prefix);
        // Add out new file
        fileList.push(prefix+STORAGEFILE_POSTFIX);
      });

      fileList.forEach(function(fileName) {
        items.push({
          title : formatFilename(fileName),
          right: [{ title:"View", icon:"icon-eye",
            callback : function() { // view the file
              downloadFile(fileName, function(contents) {
                showViewFileDialog(fileName, contents);
              });
            }
          },{ title:"Run file", icon:"icon-debug-go",
            callback : function() { // Save the file
              popup.close();
              Espruino.Core.Serial.write(`\x03\x10load(${JSON.stringify(fileName)})\n`, false, function() {
                Espruino.Core.Notifications.success(`${JSON.stringify(fileName)} loaded`, true);
              });
            }
          },{ title:"Save", icon:"icon-save",
            callback : function() { // Save the file
              downloadFile(fileName, function(contents) {
                Espruino.Core.Utils.fileSaveDialog(contents, fileName);
              });
            }
          },{ title:"Delete", icon:"icon-bin",
            callback : function() { // Delete the file
              popup.close();
              showDeleteFileDialog(fileName);
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
    getFileList(function(fileList) {
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
                callback(filename);
              }}, { name:"Cancel", callback : function() { popup.close(); }}]
            });
            popup.window.querySelector(".filenameinput").focus();
          }
        });
      }

      // filter out any 'StorageFile' files
      fileList.filter(fileName=>{
        return fileName.endsWith("\u0001");
      }).forEach(fileName=>{
        var prefix = fileName.slice(0,-1);
        fileList = fileList.filter(f=>f.slice(0,-1) != prefix);
      });

      fileList.forEach(function(fileName) {
        items.push({
          title : formatFilename(fileName),
          //icon : "icon-...",
          callback : function() {
            popup.close();
            callback(fileName);
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
