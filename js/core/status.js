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
  
  function init() {
    $('<div class="progress" icon-order="1000">'+
        '<span class="indicator">&nbsp;</span>'+
        '<span class="status">Not Connected</span>'+
      '</div>').appendTo(".toolbar .left");
  }
  
  function setStatus(text, progress) {
    console.log(">>> "+text);    
    var progressBox = $(".progress");
    var statusBox = $(".progress .status");
    var progressIndicator = $(".progress .indicator");
    statusBox.html(text);
    if (progress === undefined) {
      progressIndicator.width(0);
      progressIndicator.hide();        
      progressMax = 0;
    } else {
      progressIndicator.show();
      if (progress<1) progress=1;
      progressAmt = 0;
      progressMax = progress;
    }
    //if(Espruino.Core.Status.statusSoundOn) {Espruino.Core.Status.sendSound("status"); }
    //if(Espruino.Core.Status.statusSpeakOn) {Espruino.Core.Status.speak(text); }
  };

  function setError(text,additionalInfo) {
    var statusText = "";
    if(additionalInfo){statusText = '<button class="showErrorAdditional" info="' + additionalInfo + '">Info</button>';}
    Espruino.Core.Status.setStatus(statusText + "ERROR:" + text);    
    $(".showErrorAdditional").button({ text: false, icons: { primary: "ui-icon-info" } }).show();
    $(".showErrorAdditional").click(showAdditionalInfo);
    //if(Espruino.Core.Status.errorSoundOn) {Espruino.Core.Status.sendSound("error");}
    //if(Espruino.Core.Status.errorSpeakOn) {Espruino.Core.Status.speak(text);}
  };
  
  function showAdditionalInfo(evt){
    console.log(evt, $(this).attr("info"));
    Espruino.General.ShowSubForm("divStatusInfo",20,200,"<h3>" + $(this).attr("info") + "</h3>","#fdd","body");
  }

  function hasProgress() {
    return progressMax>0;
  };    
  
  function incrementProgress(amount) {
    if (!hasProgress()) return;      
    progressAmt += amount;
    var fullWidth = $(".progress").width()-4/*padding*/;
    var width = (progressAmt * fullWidth / progressMax)|0;
    //console.log(progressAmt,progressMax,width);
    if (width>fullWidth) width=fullWidth;
    
    $(".progress .indicator").width(width);
  };  
  
  Espruino.Core.Status = {
      init : init,
      setStatus : setStatus,
      setError : setError,
      showAdditionalInfo : showAdditionalInfo,
      hasProgress : hasProgress,
      incrementProgress : incrementProgress,
  };
}());