/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  List of Serial Ports, and handles connection and disconnection
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  var connectButton;
  var lastContents = undefined;

  function init()
  {
    connectButton = Espruino.Core.App.addIcon({
      id: "connection",
      icon: "connect",
      title : "Connect / Disconnect",
      order: -1000,
      area: document.getElementsByClassName("toolbar").length ? {
        name: "toolbar",
        position: "left"
      } : {
        name: "terminal",
        position: "top"
      },
      click: toggleConnection
    });

    Espruino.addProcessor("connected", function(data, callback) {
      connectButton.setIcon("disconnect");
      callback(data);
    });

    Espruino.addProcessor("disconnected", function(data, callback) {
      connectButton.setIcon("connect");
      callback(data);
    });
  }

  function toggleConnection() {
    if (Espruino.Core.Serial.isConnected()) {
      disconnect();
    } else {
      createPortSelector();
    }
  }

  function createPortSelector(callback) {
    var checkInt, popup;

    function selectPortInternal(port) {
      if (checkInt) clearInterval(checkInt);
      checkInt = undefined;
      popup.setContents('<h2 class="list__no-results">Connecting...</h2>');
      function connect() {
        connectToPort(port, function(success){
          popup.close();
          $(".window--modal").off("click", ".list__item a", selectPort);
          if(success){
            if (callback!==undefined) callback();
          }
        });
      }
      connect();
    }

    function selectPort() {
      selectPortInternal($(this).data("port"));
    }

    var searchHtml = '<h2 class="list__no-results">Searching...</h2>';

    function getPorts() {
      Espruino.Core.Serial.getPorts(function(items) {
        if (items.toString() == lastContents)
          return; // same... don't update
        lastContents = items.toString();


        var html;

        if(items && items.length > 0){
          html = '<ul class="list">';
          for (var i in items) {
            var port = items[i];
            // if autoconnect is set on this, just automatically connect, without displaying the window
            if (port.autoconnect)
              return selectPortInternal(port.path);

            var icon = "icon-usb";
            if (port.type=="bluetooth") icon = "icon-bluetooth";
            if (port.type=="socket") icon = "icon-network";
            if (port.type=="audio") icon = "icon-headphone";
            html += '<li class="list__item">'+
                      '<a title="'+ port.path +'" class="button button--icon button--wide" data-port="'+ port.path +'">'+
                        '<i class="'+icon+' lrg button__icon"></i>'+
                        '<span class="list__item__name">'+ port.path;
            if (port.description)
              html += '</br><span class="list__item__desc">' + port.description + '</span>';
            html += '</span>'+
                      '</a>'+
                    '</li>';
          }
          html += '</ul>';
        } else {
          html = '<h2 class="list__no-results">Searching... No ports found</h2>';
          if (Espruino.Core.Utils.isAppleDevice())
            html += '<div class="list__no-results-help">As you\'re using an iDevice<br/>you need <a href="https://itunes.apple.com/us/app/webble/id1193531073" target="_blank">to use the WebBLE app</a></div>';
          else
            html += '<div class="list__no-results-help">Have you tried <a href="http://www.espruino.com/Troubleshooting" target="_blank">Troubleshooting</a>?</div>';
        }

        popup.setContents(html);
      });
    }

    // force update
    lastContents = undefined;
    // Launch the popup
    popup = Espruino.Core.App.openPopup({
      title: "Select a port...",
      contents: searchHtml,
      position: "center",
    });

    $(".window--modal").on("click", ".list__item a", selectPort);

    // Setup checker interval
    checkInt = setInterval(getPorts, 2000);
    getPorts();


    // Make sure any calls to close popup, also clear
    // the port check interval
    var oldPopupClose = popup.close;
    popup.close = function() {
      if (checkInt) clearInterval(checkInt);
      checkInt = undefined;
      oldPopupClose();
      popup.close = oldPopupClose;
    }

  }

  function connectToPort(serialPort, callback)
  {
    if (!serialPort) {
      Espruino.Core.Notifications.error("Invalid Serial Port ");
      return;
    }
    Espruino.Core.Status.setStatus("Connecting...");
    Espruino.Core.Serial.setSlowWrite(true);
    Espruino.Core.Serial.open(serialPort, function(cInfo) {
      if (cInfo!=undefined) {
        console.log("Device found "+JSON.stringify(cInfo));
        var name = serialPort;
        if (cInfo.portName) name+=", "+cInfo.portName;
        var boardData = Espruino.Core.Env.getBoardData();
        if (!boardData.BOARD || !boardData.VERSION)
          name += " (No response from board)";
        Espruino.Core.Notifications.success("Connected to "+name, true);
        callback(true);
      } else {
        // fail
        Espruino.Core.Notifications.error("Connection Failed.", true);
        callback(false);
      }
    }, function () {
      console.log("Disconnect callback...");
      Espruino.Core.Notifications.warning("Disconnected", true);
    });

  };

  /** If we're connected, call callback, otherwise put up a connection dialog.
   * If connection succeeds, call callback - otherwise don't */
  function ensureConnected(callback) {
    if (Espruino.Core.Serial.isConnected()) {
      callback(); // great - we're done!
    } else {
      createPortSelector(callback);
    }
  }

  function disconnect() {
    if (Espruino.Core.Serial.isConnected())
      Espruino.Core.Serial.close();
  }

  Espruino.Core.MenuPortSelector = {
      init : init,

      ensureConnected : ensureConnected,
      connectToPort : connectToPort,
      disconnect : disconnect,
      showPortSelector: createPortSelector
  };

}());
