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
  
  function init() 
  {
    $("<h5 class='status__message'>Ready...</h5>").appendTo(".status__left");
    $("<div class='status__progress'><div class='status__progress-bar' /></div>").appendTo(".status__right").hide();
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
  
  Espruino.Core.Status = {
      init : init,
      setStatus : setStatus,
      hasProgress : hasProgress,
      incrementProgress : incrementProgress,
  };
}());