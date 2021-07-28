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
    ""
  ];

  function updateIconInfo() {
    var n = Espruino.Config.SAVE_ON_SEND|0;
    var txt = NAMES[n];
    if (n==3)
      txt = /*"&#x1f5ce;"+*/Espruino.Config.SAVE_STORAGE_FILE;
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
          Espruino.Core.Code.getEspruinoCode(Espruino.Core.CodeWriter.writeToEspruino);
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

  function chooseSendMethod() {
    // see saveOnSend.js
    var items = [{
      title: "RAM",
      description : "Lost after power down unless `save()` used",
      callback : function() { choose(0) }
    },{
      title: "Flash",
      description : "Executed even after power-down",
      callback : function() { choose(1) }
    }];
    if (Espruino.Plugins.Storage)
      items.push({
      title: "Storage",
      description : "Choose a file in Storage to save to",
      callback : function() {
        popup.close();
        Espruino.Core.MenuPortSelector.ensureConnected(function() {
          Espruino.Plugins.Storage.showFileChooser({title:"Choose Storage file...", allowNew:true}, function(filename) {
            Espruino.Config.set("SAVE_ON_SEND",3);
            Espruino.Config.set("SAVE_STORAGE_FILE",filename);
            updateIconInfo();
          });
        });
      }
    });
    var popup = Espruino.Core.App.openPopup({
      id: "sendmethod",
      title: "Upload Destination",
      padding: true,
      contents: Espruino.Core.HTML.domList(items),
      position: "auto",
    });
    function choose(x) {
      popup.close();
      Espruino.Config.set("SAVE_ON_SEND",x);
      Espruino.Config.set("SAVE_STORAGE_FILE","");
      updateIconInfo();
    }
  }



  Espruino.Core.Send = {
    init : init,
  };
}());
