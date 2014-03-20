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
      icon = Espruino.Core.Layout.addIcon({ name: "webcam", title : "WebCam View", order: -100, area: "right" }, toggleWebCam);    
      $('<video autoplay id="videotag" style="background-color:black;position: absolute;left:0px;bottom: 0px;"></video>').prependTo(".splitter .left"); 
    } else {
      if (hasWebCam()) toggleWebCam();
      icon.remove();
      $('video').remove();
    }
  }
  
  function hasWebCam() {
    return $('#terminal').hasClass("with_webcam");
  }

  function toggleWebCam() {
    if (!hasWebCam()) {
      var window_url = window.URL || window.webkitURL;
      navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia || navigator.msGetUserMedia;
      if (navigator.getUserMedia) {
        navigator.getUserMedia({audio: false, video: { "mandatory" : { "minWidth":"1280","minHeight":"720" }}}, function(stream) {
          webCamStream = stream;
          $('video').attr('src', window_url.createObjectURL(stream));
          $("#terminal").addClass("with_webcam");
        }, function(e) {
          console.log('onError!', e);
          Espruino.Core.Status.setError("Problem initialising WebCam");
        });
      }
    } else {
      webCamStream.stop();
      $('video').attr('src', "");
      $("#terminal").removeClass("with_webcam");
    } 
  };
  
  Espruino.Plugins.Webcam = {
    init : init,
  };
}());
