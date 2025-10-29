/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  "Send to Espruino" implementation
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  var sendIcon;
  var NAMES = [
    "RAM",
    "Flash",
    "&#9888;Flash",
    "", // Storage
    ""  // SD Card
  ];

  function updateIconInfo() {
    var n = Espruino.Config.SAVE_ON_SEND | Espruino.Core.Send.SEND_MODE_RAM;
    var txt = NAMES[n];
    if (n==Espruino.Core.Send.SEND_MODE_STORAGE)
      txt = /*"&#x1f5ce;"+*/Espruino.Config.SAVE_STORAGE_FILE;
    if (n==Espruino.Core.Send.SEND_MODE_SDCARD)
      txt = "&#x1f5ce;"+Espruino.Config.SAVE_STORAGE_FILE;
    sendIcon.setInfo(txt);
  }

  function init() {
    // Add stuff we need
    sendIcon = Espruino.Core.App.addIcon({
      id: "deploy",
      icon: "deploy",
      title : "Send to Espruino",
      order: 400,
      area: {
        name: "code",
        position: "top"
      },
      click: function() {
        Espruino.Core.MenuPortSelector.ensureConnected(function() {
          if (Espruino.Core.Terminal.isVisible())
            Espruino.Core.Terminal.focus(); // give the terminal focus
          Espruino.callProcessor("sending");
          Espruino.Core.File.getEspruinoCode(Espruino.Core.CodeWriter.writeToEspruino);
        });
      },
      more: function() {
        chooseSendMethod();
      },
      info : "---"
    });
    updateIconInfo();

    Espruino.addProcessor("connected", function(data, callback) {
      $(".send").button( "option", "disabled", false);
      callback(data);
    });
    Espruino.addProcessor("disconnected", function(data, callback) {
      $(".send").button( "option", "disabled", true);
      callback(data);
    });
  }

  function sendMethodChanged(sendMode, sendFile) {
    Espruino.Config.set("SAVE_ON_SEND",sendMode | Espruino.Core.Send.SEND_MODE_RAM);
    Espruino.Config.set("SAVE_STORAGE_FILE",sendFile);
    Espruino.callProcessor("sendModeChanged", null, function() {
      updateIconInfo();
    });
  }

  function chooseSendMethod() {
    // see saveOnSend.js
    var items = [{
      title: "RAM",
      description : "Lost after power down unless `save()` used",
      callback : function() {
        popup.close();
        sendMethodChanged(Espruino.Core.Send.SEND_MODE_RAM, "");
      }
    },{
      title: "Flash",
      description : "Executed even after power-down",
      callback : function() {
        popup.close();
        sendMethodChanged(Espruino.Core.Send.SEND_MODE_FLASH, "");
      }
    }];
    if (Espruino.Plugins.Storage) {
      items.push({
        title: "Storage",
        description : "Choose a file in Storage to save to",
        callback : function() {
          popup.close();
          Espruino.Core.MenuPortSelector.ensureConnected(function() {
            Espruino.Plugins.Storage.showFileChooser({title:"Choose Storage file...", allowNew:true}, function(filename) {
              sendMethodChanged(Espruino.Core.Send.SEND_MODE_STORAGE, filename);
            });
          });
        }
      });
      if (Espruino.Config.SHOW_SDCARD_ICON)
        items.push({
          title: "SD Card",
          description : "Choose a file on an SD card to save to (if available)",
          callback : function() {
            popup.close();
            Espruino.Core.MenuPortSelector.ensureConnected(function() {
              Espruino.Plugins.Storage.showFileChooser({title:"Choose SD card file...", allowNew:true, fs:1}, function(filename) {
                sendMethodChanged(Espruino.Core.Send.SEND_MODE_SDCARD, filename);
              });
            });
          }
        });
    }
    var popup = Espruino.Core.App.openPopup({
      id: "sendmethod",
      title: "Upload Destination",
      padding: true,
      contents: Espruino.Core.HTML.domList(items),
      position: "auto",
    });
  }

  Espruino.Core.Send = {
    init : init,
    updateIconInfo : updateIconInfo, // update the status
    SEND_MODE_RAM : 0,
    SEND_MODE_FLASH : 1,
    SEND_MODE_STORAGE : 3,
    SEND_MODE_SDCARD : 4
  };
}());
