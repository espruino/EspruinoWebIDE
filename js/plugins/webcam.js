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
               1 : "Request 720p (broken on Chrome 57)",
               2 : "Request 1080p (broken on Chrome 57)",
               3 : "Force 720p (will fail if unsupported)",
               4 : "Force 1080p (will fail if unsupported)" },
      defaultValue : 0,
      onChange : function(newValue) { showIcon(newValue); }
    });
  }

  var CONSTRAINTS = {
        0 : {},
        1 : { width: {ideal: 1280, max:1920}, height: {ideal: 720, max:1080} },
        2 : { width: {ideal: 1920, max:1920}, height: {ideal: 1080, max:1080} },
        3 : { width: {exact: 1280, max:1920}, height: {exact: 720, max:1080} },
        4 : { width: {exact: 1920, max:1920}, height: {exact: 1080, max:1080} },
  };

  function showIcon(show) {
    show = 0|show;
    var hadWebCam = hasWebCam();
    if (hadWebCam) toggleWebCam();
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
      var filters = "";
      if (show==2) filters = "filter: brightness(150%);";
      if (show==3) filters = "filter: brightness(200%);";
      $('video').remove();
      $('<video autoplay id="videotag" style="background-color:black;position: absolute;left:0;top:0;width:100%;height:100%;'+filters+'"></video>').prependTo(".editor--terminal .editor__canvas");
    } else {
      hadWebCam = false;
      if (icon!==undefined) icon.remove();
      $('video').remove();
    }
    if (hadWebCam) toggleWebCam();
  }

  function hasWebCam() {
    return $('#terminal').hasClass("terminal--webcam");
  }

  function enableWebCam(constraints) {
    var window_url = window.URL || window.webkitURL;
    navigator.getUserMedia(constraints, function(stream) {
      webCamStream = stream;
      var vid = $('video');
      vid.attr('src', window_url.createObjectURL(stream));
      console.log("Webcam started");
      setTimeout(function cb() {
        if (vid[0].videoWidth)
          console.log("Webcam video dimensions: "+vid[0].videoWidth+"x"+vid[0].videoHeight);
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
    var i = 0|Espruino.Config.WEBCAM_CONSTRAINTS;
    if (i<0 || i>=CONSTRAINTS.length) i=0;
    // parse and stringify -> clone object
    return JSON.parse(JSON.stringify(CONSTRAINTS[i]));
  }

  function showWebCamChooser(sources) {
    var html = '<ul class="list">';
    for (var i in sources) {
      html += '<li class="list__item">'+
                '<a title="'+ sources[i].label +'" class="button button--icon button--wide" data-id="'+ sources[i].id +'">'+
                  '<i class="icon-webcam lrg button__icon"></i>'+
                  '<span class="list__item__name">'+ sources[i].label;
     html += '</span>'+
                '</a>'+
              '</li>';
    }
    html += '</ul>'
    var popup = Espruino.Core.App.openPopup({
      title: "Select a webcam...",
      contents: html,
      position: "center",
    });
    $(".window--modal").on("click", ".list__item a", function() {
      var id = $(this).data("id");
      var videoConstraints = getVideoConstraints();
      videoConstraints.deviceId = { exact: id };
      enableWebCam({
          audio: false,
          video: videoConstraints
      });
    });
  }

  function enableWebCamOrChoose(sources) {
    if (sources.length == 1) {
      enableWebCam({audio: false, video: getVideoConstraints()});
    } else {
      showWebCamChooser(sources);
    }
  }

  function toggleWebCam() {
    if (!hasWebCam()) {
      navigator.getUserMedia({audio: false, video: true}, function(stream) {
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
        /*MediaStreamTrack.getSources(function (data) {
          var sources = [];
          for (var i = 0; i < data.length; i++) {
            if (data[i].kind == "video")
              sources.push({
                id : data[i].id,
                label : data[i].label.length ? data[i].label : "Video Device "+(sources.length+1)
              });
          }
          enableWebCamOrChoose(sources);
        });*/
      }, function(e) {
        console.log('WebCam Error!', e.toString());
        Espruino.Core.Notifications.error("Problem initialising WebCam");
      });
    } else {
      if (webCamStream.stop) webCamStream.stop();
      $('video').attr('src', "");
      $("#terminal").removeClass("terminal--webcam");
    }
    Espruino.Core.Terminal.focus();
  };

  Espruino.Plugins.Webcam = {
    init : init,
  };
}());
