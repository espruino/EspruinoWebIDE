/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Offline mode
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  if (typeof chrome=="undefined" || !chrome.storage || !chrome.storage.local) {
    console.log("No chrome.storage API - disabling Offline mode");
    return;
  }

  var OFFLINE_DATA;

  function init() {
    Espruino.addProcessor("getURL", getOffline);

    chrome.storage.local.get( "OFFLINE_DATA", function (data) {
      var dataHex = data["OFFLINE_DATA"];
      console.log("GET chrome.storage.local.OFFLINE_DATA = "+(dataHex?dataHex.length:0)+" bytes");
      var data = new Uint8Array(dataHex.length/2);
      for (var i=0;i<data.length;i++) // TODO: something wrong here?
        data[i] = parseInt(dataHex.substr(i*2,2),16);
      OFFLINE_DATA = data.buffer;
    });

    Espruino.Core.Config.addSection("Offline Mode", {
      sortOrder:500,
      description: "This allows you to download common files (modules, board "+
                   "description files) and then use them even when you're not "+
                   "connected to the internet",
    });
    Espruino.Core.Config.add("OFFLINE_ENABLED", {
      section : "Offline Mode",
      name : "Enable offline mode",
      description : "Enable offline mode - if we have the required files",
      type : "boolean",
      defaultValue : false,
      onChange : function(newValue) {
        if (newValue) {
          if (!OFFLINE_DATA) {
            getOfflineData();
          }
        }
      }
    });
    Espruino.Core.Config.add("OFFLINE_DATA", {
      section : "Offline Mode",
      name : "Offline Data",
      description : "Click the button to the right to download new offline data",
      type : "button",
      label : "Get offline data",
      defaultValue : '',
      onClick : getOfflineData
    });
  }

  function getOfflineData() {
    var url = "http://localhost/espruino/files/offline.zip";
    Espruino.Core.Status.setStatus("Downloading offline data");
    /*Espruino.Core.Utils.getURL(url, function(data) {
      OFFLINE_DATA = data;
      Espruino.Core.Status.setStatus("Loaded data - "+data.length+" bytes");
      for (var i=0;i<16;i++)
        console.log(data.charCodeAt(i).toString(16));
    });*/
    var xhr = new XMLHttpRequest();
    xhr.responseType = "arraybuffer";
    xhr.addEventListener("load", function () {
      if (xhr.status === 200) {
        Espruino.Core.Status.setStatus("Downloaded "+data.length+" bytes. Saving to local storage");
        var data = xhr.response;
        var dataHex = "";
        for (var i=0;i<data.length;i++)
          dataHex += (256+data[i]).toString(16).substr(-2);
        OFFLINE_DATA = data;
        chrome.storage.local.set({ OFFLINE_DATA : dataHex });
        Espruino.Core.Status.setStatus("Done.");
      } else
        Espruino.Core.Notifications.error("Error downloading file - HTTP "+xhr.status);
    });
    xhr.addEventListener("error", function () {
      callback("Error downloading file");
    });
    xhr.open("GET", url, true);
    xhr.send(null);
  }

  function findOffline(url, callback) {
    // not something we can handle
    var fileName;
    // modules
    var urlBase = Espruino.Config.MODULE_URL;
    if (urlBase[urlBase.length-1]!="/")
      urlBase += "/";
    if (url.substr(0,urlBase.length)==urlBase)
      fileName = "modules/"+url.substr(urlBase.length);
    // board JSON
    urlBase = Espruino.Config.BOARD_JSON_URL;
    if (urlBase[urlBase.length-1]!="/")
      urlBase += "/";
    if (url.substr(0,urlBase.length)==urlBase)
      fileName = "json/"+url.substr(urlBase.length);
    console.log("Searching for "+fileName);
    var zip = new JSZip();
    zip.loadAsync(OFFLINE_DATA).then(function(zip) {
      var f = zip.file(fileName);
      if (f) {
        console.log(fileName+" found in offline archive");
        return f.async("string");
      } else {
        console.log(fileName+" not found in offline archive");
        callback(); // no file found
      }
    }).then(function (data) {
      callback(data);
    }).catch(function(err) {
      console.log("Error "+err);
    });
  }

  function getOffline(data, callback) {
    if (!Espruino.Config.OFFLINE_ENABLED ||
        !OFFLINE_DATA)
      return callback(data); // continue as normal

    findOffline(data.url, function(result) {
      if (result) callback({data: result});
      else callback(data); // continue as normal
    })
  }

  Espruino.Plugins.Offline = {
    init : init,
  };
}());
