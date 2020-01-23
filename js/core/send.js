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
    "&#9888;Flash"
  ];

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
      info : NAMES[Espruino.Config.SAVE_ON_SEND]
    });

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
    },{
      title: "Flash (always)",
      description : "Executed even after `reset()` is called. USE WITH CARE",
      callback : function() { choose(2) }
    },
    ];
    var popup = Espruino.Core.App.openPopup({
      id: "sendmethod",
      title: "Upload Destination",
      padding: true,
      contents: "",
      position: "auto",
    });
    popup.window.append(Espruino.Core.HTML.domList(items));
    function choose(x) {
      popup.close();
      Espruino.Config.set("SAVE_ON_SEND",x);
      sendIcon.setInfo(NAMES[x]);
    }
  }

  Espruino.Core.Send = {
    init : init,
  };
}());
