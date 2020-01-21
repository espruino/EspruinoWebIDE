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
      icon: "star",
      title : "Access files on device",
      order: 300,
      area: {
        name: "code",
        position: "bottom"
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
      js += `require("Storage").write(${fn},atob(${JSON.stringify(btoa(part))}),${i}${(i==0)?","+contents.length:""})\n`;
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

  function showStorage() {
    var html = `
      <div style="height:100%;min-height:200px;min-width:300px;position:relative;top:0px;left:0px;bottom:0px;right:50%;padding:10px 10px 10px 10px;overflow-y:scroll;" class="devicefiles">
      ${Espruino.Core.Utils.htmlLoading()}
    </div>
    `;
    var popup = Espruino.Core.App.openPopup({
      id: "storage",
      title: "Device Storage",
      padding: false,
      contents: html,
      position: "auto",
    });

    getFileList(function(fileList) {
      var items = [{
        title: "Upload a file",
        icon : "icon-folder-open",
        callback : function() {
          popup.close();
          Espruino.Core.Utils.fileOpenDialog("storage","text",function(contents) {
            var html = `<div">
            <p>Uploading ${contents.length} bytes to Storage.</p>
            <label for="filename">Filename (max 8 chars)</label><br/>
            <input name="filename" class="filenameinput" type="text" maxlength="8" style="border: 2px solid #ccc;"></input>
            </div>
            `;

            var popup = Espruino.Core.App.openPopup({
              id: "storagefileupload",
              title: "Upload a file",
              padding: true,
              contents: html,
              position: "auto",
              ok : function() {
                var filename = popup.window.querySelector(".filenameinput").value;
                console.log("Write file to Storage as "+JSON.stringify(filename));
                uploadFile(filename, contents, function() {
                  console.log("Upload complete!");
                });
                popup.close();
              },
              cancel : function() { popup.close(); },
            });
          });
        }
      }];

      fileList.forEach(function(fileName) {
        var actualFileName = Espruino.Core.Utils.parseJSONish(fileName);
        items.push({
          title : fileName,
          right: [{ title:"View", icon:"icon-eye",
            callback : function() {
              console.log("View",fileName);
              downloadFile(actualFileName, function(contents) {
                var html;
                if (Espruino.Core.Utils.isASCII(contents)) {
                  html = '<div style="overflow-y:auto;font-family: monospace;">'+
                    Espruino.Core.Utils.escapeHTML(contents).replace(/\n/g,"<br>")+'</div>';
                } else {
                  var img = '<div style="text-align:center;padding-top:10px;min-width:200px;">'+
                            '<a href="'+imageconverter.stringToImageURL(contents,{transparent:true})+'" download="image.png">'+
                            imageconverter.stringToImageHTML(contents,{transparent:false})+'</a></div>';
                  if (img) {
                    html = img;
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
                  ok : function() { popup.close(); }
                });
              });
            }
          },{ title:"Save", icon:"icon-save",
            callback : function() { // Save the file
              downloadFile(actualFileName, function(contents) {
                Espruino.Core.Utils.fileSaveDialog(contents, actualFileName);
              });
            }
          },{ title:"Delete", icon:"icon-bin",
            callback : function() { // Save the file
              popup.close();
              var deletepopup = Espruino.Core.App.openPopup({
                id: "storagefiledelete",
                title: "Really remove "+fileName+"?",
                padding: true,
                contents: "Do you really want to remove this file?",
                position: "auto",
                yes : function() {
                  deleteFile(actualFileName, function() {
                    Espruino.Core.Status.setStatus("File deleted.");
                  });
                  deletepopup.close();
                },
                no : function() { deletepopup.close(); }
              });
            }
          }]
        });
      });

      var deviceFileList = document.querySelector("#storage .devicefiles");
      deviceFileList.innerHTML = "";
      deviceFileList.append(Espruino.Core.Utils.domList(items));

    });
  }

  Espruino.Plugins.Storage = {
    init : init,
  };
}());
