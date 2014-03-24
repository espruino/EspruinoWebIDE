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

  var icon;
  var webCamStream;
  
  function init() {
    Espruino.Core.Config.add("SHOW_WEBCAM_ICON", {
      section : "General",
      name : "Webcam Icon",
      description : "Show an icon that allows the terminal to be overlaid on the view from a Webcam",
      type : "boolean",
      defaultValue : false, 
      onChange : function(newValue) { showIcon(newValue); }
    });    

    showIcon(Espruino.Config.SHOW_WEBCAM_ICON);
  }

  function showIcon(show) {
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
      $('<video autoplay id="videotag" style="background-color:black;position: absolute;left:0;top:0;width:100%;height:100%;"></video>').prependTo(".editor--terminal .editor__canvas"); 
    } else {
      if (hasWebCam()) toggleWebCam();
      if (icon!==undefined) icon.remove();
      $('video').remove();
    }
  }
  
  function hasWebCam() {
    return $('#terminal').hasClass("terminal--webcam");
  }

  function toggleWebCam() {
    if (!hasWebCam()) {
      var window_url = window.URL || window.webkitURL;
      navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia || navigator.msGetUserMedia;
      if (navigator.getUserMedia) {
        navigator.getUserMedia({audio: false, video: true}, function(stream) {
          webCamStream = stream;
          $('video').attr('src', window_url.createObjectURL(stream));
          $("#terminal").addClass("terminal--webcam");
        }, function(e) {
          console.log('onError!', e);
          Espruino.Core.Notifications.error("Problem initialising WebCam");
        });
      }
    } else {
      webCamStream.stop();
      $('video').attr('src', "");
      $("#terminal").removeClass("terminal--webcam");
    }
    Espruino.Core.Terminal.focus(); 
  };
  
  Espruino.Plugins.Webcam = {
    init : init,
  };
}());
