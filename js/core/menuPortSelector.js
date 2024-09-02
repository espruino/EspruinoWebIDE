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
  var popup;

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
      showPortSelector();
    }
  }

  function showPortSelector(callback) {
    var checkInt;

    function selectPortInternal(port) {
      if (checkInt) clearInterval(checkInt);
      checkInt = undefined;
      popup.setContents('<h2 class="list__no-results">Connecting...</h2>');
      function connect() {
        connectToPort(port, function(success){
          popup.close();
          if(success){
            if (callback!==undefined) callback();
          }
        });
      }
      connect();
    }

    var searchHtml = `<h2 class="list__no-results">Searching...</h2>
    <div class="list__no-results-help"><a href="#" onclick="Espruino.Core.MenuPortSelector.showPortStatus()">Show status</a>`;

    function getPorts() {
      Espruino.Core.Serial.getPorts(function(items) {
        if (items.toString() == lastContents)
          return; // same... don't update
        lastContents = items.toString();


        if(items && items.length > 0) {
          // if autoconnect is set on this, just automatically connect, without displaying the window
          var autoconnect = items.find(port=>port.autoconnect);
          if (autoconnect)
            return selectPortInternal(autoconnect.path);
          //  work out list of items
          var listItems = items.map(function(port) {
            var icon = "icon-usb";
            if (port.type=="bluetooth") icon = "icon-bluetooth";
            if (port.type=="socket") icon = "icon-network";
            if (port.type=="audio") icon = "icon-headphone";

            return {
              icon : icon,
              title : port.path,
              description : port.description,
              callback : function() {
                selectPortInternal(port.path);
              }
            }
          });
          var domList = Espruino.Core.HTML.domList(listItems);
          var footerHtml = "";
          if (Espruino.Core.RemoteConnection) // serial_webrtc.js
            footerHtml = '<span><a href="#" onclick="Espruino.Core.MenuPortSelector.showRemoteConnectionPopup()">🌐 Remote Connection</a></span>';
          footerHtml += '<span style="float: right;"><a href="#" onclick="Espruino.Core.MenuPortSelector.showPortStatus()">status</a></span>'
          domList.append(Espruino.Core.HTML.domElement('<li>'+footerHtml+'</li>'));
          popup.setContents(domList);
        } else {
          var html = '<h2 class="list__no-results">Searching... No ports found</h2>';
          html += `<div class="list__no-results-help"><a href="#" onclick="Espruino.Core.MenuPortSelector.showPortStatus()">Show status</a><br/>
                   Have you tried <a href="http://www.espruino.com/Troubleshooting" target="_blank">Troubleshooting</a>?</div>`;
          popup.setContents(html);
        }
      });
    }

    // force update
    lastContents = undefined;
    // Launch the popup
    popup = Espruino.Core.App.openPopup({
      id: "portselector",
      title: "Select a port...",
      contents: searchHtml,
      position: "center",
      onClose: function() {
        // Make sure any calls to close popup, also clear
        // the port check interval
        if (checkInt) clearInterval(checkInt);
        checkInt = undefined;
        popup = undefined;
      }
    });

    // Setup checker interval
    checkInt = setInterval(getPorts, 2000);
    getPorts();
  }

  function connectToPort(serialPort, callback) {
    if (!serialPort) {
      Espruino.Core.Notifications.error("Invalid Serial Port ");
      return;
    }
    function nameFromConInfo(cInfo) {
      var name = serialPort;
      if (cInfo.portName && name!=cInfo.portName) name+=", "+cInfo.portName;
      return name;
    }

    Espruino.Core.Status.setStatus("Connecting...");
    Espruino.Core.Serial.open(serialPort, function(cInfo) {
      if (cInfo!==undefined && cInfo.error===undefined) {
        console.log("Device found "+JSON.stringify(cInfo));
        var name = nameFromConInfo(cInfo);
        if (Espruino.Core.Env) {
          var boardData = Espruino.Core.Env.getBoardData();
          if (!boardData.BOARD || !boardData.VERSION)
            name += " (No response from board)";
        }
        Espruino.Core.Notifications.success("Connected to "+name, true);
        callback(true);
      } else {
        // fail
        var msg = ".";
        if (cInfo!==undefined && cInfo.error!==undefined)
          msg = ": "+cInfo.error;
        Espruino.Core.Notifications.error("Connection Failed"+msg, true);
        callback(false);
      }
    }, function (cInfo) {
      console.log("Disconnect callback... "+JSON.stringify(cInfo));
      Espruino.Core.Notifications.warning("Disconnected from "+nameFromConInfo(cInfo), true);
    });

  };

  /** If we're connected, call callback, otherwise put up a connection dialog.
   * If connection succeeds, call callback - otherwise don't */
  function ensureConnected(callback) {
    if (Espruino.Core.Serial.isConnected()) {
      callback(); // great - we're done!
    } else {
      showPortSelector(callback);
    }
  }

  function disconnect() {
    if (Espruino.Core.Serial.isConnected())
      Espruino.Core.Serial.close();
  }

  function showPortStatus() {
    var html = `<table style="padding-top: 8px;padding-bottom: 8px;">`;
    Espruino.Core.Serial.devices.forEach(device => {
      var deviceText = "";
      var deviceIcon = "&nbsp;";
      var color = "black";
      if (device.getStatus) {
        var s = device.getStatus();
        if (s===true) { deviceIcon=`&#10003;`; deviceText = "Ok"; color="green"; }
        else if (s.warning) { deviceIcon=`&#9888;`; deviceText = s.warning; color="orange"; }
        else if (s.error) { deviceIcon=`&#10006;`; deviceText = s.error; color="red"; }
        else deviceText = "Unknown Status";
      } else {
        deviceText = "Unknown Status";
      }
      html += `<tr><td><span style="color:${color};font-size:200%;">${deviceIcon}</span></td><td style="font-weight:bold">${device.name}</td><td>${deviceText}</td></tr>\n`;
    });
    html += `</table>`;

    Espruino.Core.App.openPopup({
      id: "portstatus",
      title: "Port Status",
      contents: html,
      position: "auto", padding: true
    });
  }

  function showRemoteConnectionPopup() {
    if (popup) popup.close();
    Espruino.Core.RemoteConnection.showPairingPopup();
  }

  Espruino.Core.MenuPortSelector = {
      init : init,

      ensureConnected : ensureConnected,
      connectToPort : connectToPort,
      disconnect : disconnect,
      showPortSelector: showPortSelector,
      showPortStatus : showPortStatus,
      showRemoteConnectionPopup : showRemoteConnectionPopup
  };

}());
