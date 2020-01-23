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

  // TODO:
  //   Icon + placement
  //   Handle 'StorageFile' chunked files correctly

  /// Chunk size the files are downloaded in
  var CHUNKSIZE = 384;// or any multiple of 96 for atob/btoa

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

  function downloadFile(fileName, callback) {
    //callback("Lots of text here");
    //Espruino.Core.Utils.executeExpression("btoa(require('Storage').read("+JSON.stringify(fileName)+"))", function(contents) {
    Espruino.Core.Utils.executeStatement(`(function(filename) {
  var s = require("Storage").read(filename);
  for (var i=0;i<s.length;i+=${CHUNKSIZE}) console.log(btoa(s.substr(i,${CHUNKSIZE})));
})(${JSON.stringify(fileName)});`, function(contents) {
      // atob doesn't care about the newlines
      callback(contents ? atob(contents) : undefined);
    });

  }

  function uploadFile(fileName, contents, callback) {
    var js = "";
    if ("string" != typeof contents)
      throw new Error("Expecting a string for contents");
    if (fileName.length==0 || fileName.length>8)
      throw new Error("Invalid filename length");

    var fn = JSON.stringify(fileName);
    for (var i=0;i<contents.length;i+=CHUNKSIZE) {
      var part = contents.substr(i,CHUNKSIZE);
      js += `\n\x10require("Storage").write(${fn},atob(${JSON.stringify(Espruino.Core.Utils.btoa(part))}),${i}${(i==0)?","+contents.length:""})`;
    }
    Espruino.Core.Utils.executeStatement(js, callback);
  }

  function deleteFile(fileName, callback) {
    var fn = JSON.stringify(fileName);
    Espruino.Core.Utils.executeStatement(`require("Storage").erase(${fn})\n`, callback);
  }

  function getFileList(callback) {
    //callback(['"a"','"b"','"c"']);
    Espruino.Core.Utils.executeExpression("require('Storage').list().map(x=>JSON.stringify(x))",function(files) {
      var fileList = [];
      try {
        fileList = JSON.parse(files);
        // fileList.sort(); // ideally should ignore first char for sorting
      } catch (e) {
        console.log(e);
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
    Espruino.Core.Utils.fileOpenDialog("storage","text",function(contents, mimeType, fileName) {
      var contentsToUpload = contents;
      var imageTypes = ['image/gif', 'image/jpeg', 'image/png'];
      var isImage = imageTypes.includes(mimeType);
      var html = `<div>
      <p>Uploading <span id="ressize">${contents.length}</span> bytes to Storage.</p>
      <label for="filename">Filename (max 8 chars)</label><br/>
      <input name="filename" class="filenameinput" type="text" maxlength="8" style="border: 2px solid #ccc;" value="${Espruino.Core.Utils.escapeHTML(fileName.substr(0,8))}"></input>
      `;
      if (isImage) {
        html += `<p>The file you uploaded is an image...</p>
        <input type="checkbox" id="convert" checked>Convert for Espruino</input><br/>
        <div id="imageoptions">
        <input type="checkbox" id="transparent" checked>Transparency?</input><br/>
        Colours: <select id="colorStyle">
        <option value="1bit" selected="selected">1 bit black/white</option>
        <option value="1bitinverted">1 bit white/black</option>
        <option value="2bitbw">2 bit black & white</option>
        <option value="4bitmac">4 bit Mac palette</option>
        <option value="web">8 bit Web palette</option>
        <option value="rgb565">16 bit RGB565</option>
        </select><br/>
        Diffusion: <select id="diffusion">
        <option value="none" selected="selected">Flat</option>
        <option value="error">Error Diffusion</option>
        <option value="errorrandom">Randomised Error Diffusion</option>
        <option value="random1">Random small</option>
        <option value="random2">Random large</option>
        </select><br/>
        Brightness:<input type="range" id="brightness" min="-255" max="255" value="0"></input><br/>

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
          if (filename.length>8) {
            Espruino.Core.Notifications.error("Filename greater than 8 characters")
            return;
          }
          console.log("Write file to Storage as "+JSON.stringify(filename));
          uploadFile(filename, contentsToUpload, function() {
            console.log("Upload complete!");
          });
          popup.close();
        }}, { name:"Cancel", callback : function() { popup.close(); }}]
      });
      if (isImage) {
        var controls = {
          convert : popup.window.querySelector("#convert"),
          imageoptionsdiv : popup.window.querySelector("#imageoptions"),
          transparent : popup.window.querySelector("#transparent"),
          diffusion : popup.window.querySelector("#diffusion"),
          brightness : popup.window.querySelector("#brightness"),
          colorStyle : popup.window.querySelector("#colorStyle"),
          canvas1 : popup.window.querySelector("#canvas1"),
          canvas2 : popup.window.querySelector("#canvas2"),
          ressize : popup.window.querySelector("#ressize")
        };
        controls.convert.addEventListener("change", recalculate);
        controls.transparent.addEventListener("change", recalculate);
        controls.diffusion.addEventListener("change", recalculate);
        controls.brightness.addEventListener("change", recalculate);
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
            options.brightness = 0|controls.brightness.value;
            options.mode = controls.colorStyle.options[controls.colorStyle.selectedIndex].value;
            if (options.mode=="1bitinverted") {
              options.mode="1bit";
              options.inverted=true;
            }



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

            controls.canvas2.width = img.width;
            controls.canvas2.height = img.height;
            controls.canvas2.style = "display:block;border:1px solid black;margin:8px;"
            var ctx2 = canvas2.getContext("2d");
            imageconverter.RGBAtoCheckerboard(imageData.data, options)
            ctx2.putImageData(imageData,0,0);

            // checkerboard for transparency on original image
            var imageData = ctx1.getImageData(0, 0, img.width, img.height);
            imageconverter.RGBAtoCheckerboard(imageData.data, options)
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

  function showViewFileDialog(fileName, actualFileName) {
    console.log("View",fileName);
    var buttons = [{ name:"Ok", callback : function() { popup.close(); }}];
    downloadFile(actualFileName, function(contents) {
      var html;
      if (Espruino.Core.Utils.isASCII(contents)) {
        html = '<div style="overflow-y:auto;font-family: monospace;">'+
          Espruino.Core.Utils.escapeHTML(contents).replace(/\n/g,"<br>")+'</div>';
          buttons.push({ name:"Copy to Editor", callback : function() {
            Espruino.Core.EditorJavaScript.setCode(contents);
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
      var popup = Espruino.Core.App.openPopup({
        id: "storagefileview",
        title: "Contents of "+fileName,
        padding: true,
        contents: html,
        position: "auto",
        buttons : buttons
      });
    });
  }

  function showDeleteFileDialog(fileName, actualFileName) {
    var popup = Espruino.Core.App.openPopup({
      id: "storagefiledelete",
      title: "Really remove "+fileName+"?",
      padding: true,
      contents: "Do you really want to remove this file?",
      position: "auto",
      buttons : [{ name:"Yes", callback : function() {
        deleteFile(actualFileName, function() {
          Espruino.Core.Status.setStatus("File deleted.");
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
      contents: Espruino.Core.Utils.htmlLoading(),
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
      }];

      fileList.forEach(function(fileName) {
        // fileName is pre-quoted
        var actualFileName = Espruino.Core.Utils.parseJSONish(fileName);
        // actualFileName is unquoted
        items.push({
          title : fileName,
          right: [{ title:"View", icon:"icon-eye",
            callback : function() { // view the file
              showViewFileDialog(fileName, actualFileName);
            }
          },{ title:"Run file", icon:"icon-debug-go",
            callback : function() { // Save the file
              popup.close();
              Espruino.Core.Serial.write(`\x03\x10load(${fileName})\n`, function() {
                // done...
              });
            }
          },{ title:"Save", icon:"icon-save",
            callback : function() { // Save the file
              downloadFile(actualFileName, function(contents) {
                Espruino.Core.Utils.fileSaveDialog(contents, actualFileName);
              });
            }
          },{ title:"Delete", icon:"icon-bin",
            callback : function() { // Delete the file
              popup.close();
              showDeleteFileDialog(fileName, actualFileName);
            }
          }]
        });
      });

      popup.setContents(Espruino.Core.Utils.domList(items));

    });
  }

  Espruino.Plugins.Storage = {
    init : init,
  };
}());
