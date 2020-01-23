/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Status menu
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  var progressAmt, progressMax = 0;
  var statusWindow;

  function init()
  {
    $("<h5 class='status__message'>Ready...</h5>").appendTo(".status__left");
    $("<h5 class='status__port'></h5>").appendTo(".status__right");
    $("<div class='status__progress'><div class='status__progress-bar' /></div>").appendTo(".status__right").hide();
    Espruino.addProcessor("connected", function(data, callback) {
      if (data) {
        var name = data.port;
        if (data.portName) name = data.portName;
        setConnectedPort(name);
      }
      callback(data);
    });

    Espruino.addProcessor("disconnected", function(data, callback) {
      setConnectedPort("");
      callback(data);
    });
  }

  function setStatus(text, progress) {
    console.log(">>> "+ text);
    //var progressBox = $(".progress");
    //var statusBox = $(".progress .status");
    //var progressIndicator = $(".progress .indicator");
    $(".status__message").html(text);

    if (progress === undefined) {
      $(".status__progress-bar").width(0);
      $(".status__progress").hide();
      progressMax = 0;
    } else {
      $(".status__progress").show();
      if (progress < 1) progress = 1;
      progressAmt = 0;
      progressMax = progress;
    }

    //if(Espruino.Core.Status.statusSoundOn) {Espruino.Core.Status.sendSound("status"); }
    //if(Espruino.Core.Status.statusSpeakOn) {Espruino.Core.Status.speak(text); }
  };

  function hasProgress() {
    return progressMax > 0;
  };

  function incrementProgress(amount) {
    if (!hasProgress()) return;
    progressAmt += amount;
    var progressPercent = (100 / progressMax) * progressAmt;
    $(".status__progress-bar").css("width", progressPercent + "%");
  };

  function setConnectedPort(port) {
    if (!port) port="";
    var idx = port.lastIndexOf("/");
    if (idx>=0 && idx<port.length-1)
      port = port.substr(idx+1);
    $(".status__port").html(port);
  };

  function showStatusWindow(title, message) {
    if (statusWindow) statusWindow.close();
    statusWindow = Espruino.Core.App.openPopup({
      title: title,
      padding: true,
      contents: '<div class="status__progress" style="width:100%;margin-top:10px;"><div class="status__progress-bar"></div></div>'+
                '<p><b>'+message+'</b>... <span class="status__message"></span></p>',
      position: "center",
    });
  }
  function hideStatusWindow() {
    if (statusWindow) {
      statusWindow.close();
      statusWindow = undefined;
    }
  }

  Espruino.Core.Status = {
      init : init,
      setStatus : setStatus,
      hasProgress : hasProgress,
      incrementProgress : incrementProgress,
      showStatusWindow : showStatusWindow,
      hideStatusWindow : hideStatusWindow
  };
}());
