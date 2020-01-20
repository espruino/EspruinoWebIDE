/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  An Example Plugin
 ------------------------------------------------------------------
**/
"use strict";
(function(){

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
    Espruino.Core.Utils.executeExpression("btoa(require('Storage').read("+JSON.stringify(fileName)+"))", function(contents) {
      callback(atob(JSON.parse(contents)));
    });

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

  function showStorage() {
    var html = `
    <div style="position: relative;height: 100%; overflow: hidden;">
      <div style="height:100%;position:absolute;top:0px;left:0px;bottom:0px;right:50%;padding:10px 10px 10px 10px;overflow-y:scroll;" class="devicefiles">
      ${Espruino.Core.Utils.htmlLoading()}
      </div>
      <div style="height:100%;position:absolute;top:0px;right:0px;bottom:0px;left:50%;padding:10px 10px 10px 10px;overflow-y:scroll;">
      Right
      </div>
    </div>
    `;
    var popup = Espruino.Core.App.openPopup({
      id: "storage",
      title: "Device Storage",
      padding: false,
      contents: html,
      position: "stretch",
    });

    getFileList(function(fileList) {
      var items = [{
        title: "Upload file",
        icon : "icon-folder-open",
        callback : function() {
          fileOpenDialog("storage","text",function(data) {
            // ...
            alert("Now what filename?");
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
                if (Espruino.Core.Utils.isASCII(contents)) {
                  var popup = Espruino.Core.App.openPopup({
                    id: "storagefile",
                    title: "Contents of "+fileName,
                    padding: true,
                    contents: '<div style="overflow:auto">'+Espruino.Core.Utils.escapeHTML(contents)+'</div>',
                    position: "center",
                    ok : function() { popup.close(); }
                  });
                } else {
                  console.log("FIXME - binary data...");
                }
              });
            }
          },{ title:"Save", icon:"icon-save",
            callback : function() { // Save the file
              downloadFile(actualFileName, function(contents) {
                Espruino.Core.Utils.fileSaveDialog(contents, actualFileName);
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
