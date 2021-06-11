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

  navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                      navigator.mozGetUserMedia || navigator.msGetUserMedia;


  var icon;
  var webCamStream;

  function init() {
    if (!navigator.getUserMedia) return;

    Espruino.Core.Config.add("SHOW_WEBCAM_ICON", {
      section : "General",
      name : "Webcam Icon",
      description : "Show an icon that allows the terminal to be overlaid on the view from a Webcam",
      type : { 0 : "No",
               1 : "Yes",
               2 : "Yes, add 50% brightness",
               3 : "Yes, add 100% brightness" },
      defaultValue : 0,
      onChange : function(newValue) { showIcon(newValue); }
    });
    showIcon(Espruino.Config.SHOW_WEBCAM_ICON);
    Espruino.Core.Config.add("WEBCAM_CONSTRAINTS", {
      section : "General",
      name : "Webcam Resolution",
      description : "When using the Webcam, should we request a specific resolution?",
      type : { 0 : "Default",
               1 : "Request 720p",
               2 : "Request 1080p",
               3 : "Force 720p (will fail if unsupported)",
               4 : "Force 1080p (will fail if unsupported)",
               5 : "Force 1080p25 (will fail if unsupported)" },
      defaultValue : 0,
      onChange : function(newValue) { showIcon(newValue); }
    });
  }

  var CONSTRAINTS = {
        0 : {},
        1 : { width: {ideal:1280}, height: {ideal:720} },
        2 : { width: {ideal:1920}, height: {ideal:1080} },
        3 : { width: {exact:1280}, height: {exact:720}, },
        4 : { width: {exact:1920}, height: {exact:1080}, },
        5 : { width: {exact:1920}, height: {exact:1080}, frameRate: {exact:25} },
  };

  function showIcon(show) {
    show = 0|show;
    var hadWebCam = hasWebCam();
    if (hadWebCam) toggleWebCam();
    var vid = document.getElementById("videotag");
    if (vid) vid.remove();
    if (show) {
      icon = Espruino.Core.App.addIcon({
        id: "webcam",
        icon: "webcam",
        title : "WebCam View",
        order: -90,
        area: {
          name: "terminal",
          position: "top"
        },
        click: toggleWebCam
      });
      var filters = "background-color:black;position:absolute;left:0;top:0;width:100%;height:100%;";
      filters += "object-fit:cover;";
      if (show==2) filters += "filter: brightness(150%);";
      if (show==3) filters += "filter: brightness(200%);";
      $('<video autoplay id="videotag" style="'+filters+'"></video>').prependTo(".editor--terminal .editor__canvas");
    } else {
      hadWebCam = false;
      if (icon!==undefined) {
        icon.remove();
        icon = undefined;
      }
    }
    if (hadWebCam) toggleWebCam();
  }

  function hasWebCam() {
    return $('#terminal').hasClass("terminal--webcam");
  }

  function enableWebCam(constraints) {
    var window_url = window.URL || window.webkitURL;
    var vid = document.getElementById("videotag");
    console.log("Requesting WebCam ", constraints);
    navigator.getUserMedia(constraints, function(mediaSource) {
      webCamStream = mediaSource;
      try {
          vid.srcObject = mediaSource;
        } catch (error) {
          vid.src = URL.createObjectURL(mediaSource);
        }
      console.log("Webcam started");
      setTimeout(function cb() {
        if (vid.videoWidth)
          console.log("Webcam video dimensions: "+vid.videoWidth+"x"+vid.videoHeight);
        else
          setTimeout(cb, 1000);
      }, 1000);
      $("#terminal").addClass("terminal--webcam");
    }, function(e) {
      console.log('onError!', e);
      Espruino.Core.Notifications.error("Problem initialising WebCam");
    });
  }

  function getVideoConstraints() {
    var term = document.querySelector(".editor__canvas__terminal");
    if (term)
      CONSTRAINTS[0] =  { width: term.clientWidth, height: term.clientHeight };
    var i = 0|Espruino.Config.WEBCAM_CONSTRAINTS;
    if (i<0 || i>=CONSTRAINTS.length) i=0;
    return CONSTRAINTS[i];
  }

  function enableWebCamDeviceId(id) {
    var videoConstraints = getVideoConstraints();
    if (id!==undefined && id!="")
      videoConstraints.deviceId = { exact: id };
    enableWebCam({
        audio: false,
        video: videoConstraints
    });
  }

  function showWebCamChooser(sources) {
    var popup = Espruino.Core.App.openPopup({
      title: "Select a webcam...",
      contents: Espruino.Core.HTML.htmlLoading(),
      position: "center",
    });
    var items = sources.map(function(source) {
      return {
        icon : "icon-webcam",
        title : source.label,
        callback : function() {
          popup.close();
          enableWebCamDeviceId(source.id);
        }
      };
    });
    if (!items.length)
      items = [{
        icon : "icon-webcam",
        title : "No Webcams found",
        callback : function() {
          popup.close();
        }
      }];

    popup.setContents(Espruino.Core.HTML.domList(items));
  }

  function enableWebCamOrChoose(sources) {
    if (sources.length == 1) {
      enableWebCamDeviceId(sources[0].id);
    } else {
      showWebCamChooser(sources);
    }
  }

  function toggleWebCam() {
    if (!hasWebCam()) {
      navigator.mediaDevices.enumerateDevices().then(function(data){
        var sources = [];
        for (var i = 0; i < data.length; i++) {
          if (data[i].kind == "videoinput")
            sources.push({
              id : data[i].deviceId,
              label : data[i].label.length ? data[i].label : "Video Device "+(sources.length+1)
            });
        }
        enableWebCamOrChoose(sources);
      });
    } else {
      if (webCamStream.stop) // deprecated
        webCamStream.stop();
      if (webCamStream.getTracks) // new hotness
        webCamStream.getTracks().forEach(track => track.stop())
      $('video').attr('src', "");
      $("#terminal").removeClass("terminal--webcam");
    }
    Espruino.Core.Terminal.focus();
  };

  Espruino.Plugins.Webcam = {
    init : init,
  };
}());
