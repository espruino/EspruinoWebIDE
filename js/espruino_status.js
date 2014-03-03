/*
 * The MIT License

Copyright (c) 2013 by Gordon Williams

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
"use strict";
(function(){
    // Status/progress bar
    Espruino["Status"] = {};
    Espruino.Status.statusSoundOn = false;
    Espruino.Status.errorSoundOn = false;    
    Espruino.Status.statusSpeakOn = false;
    Espruino.Status.errorSpeakOn = false;    
    var statusBox, progressBox, progressIndicator,audioPlayer;
    var progressAmt, progressMax = 0;
    
    Espruino.Status.init = function(){
      statusBox = $("#status");
      progressBox = $("#progress");
      progressIndicator = $("#progressindicator");
      progressBox.hide();
      audioPlayer = new Audio(""); 
      document.body.appendChild(audioPlayer);
      audioPlayer.addEventListener('canplay', function() { audioPlayer.play(); }, false);
    };
    Espruino.Status["initOptions"] = function(){
      Espruino.Options.optionFields.push({id:"#errorSoundOn",module:"Status",field:"errorSoundOn",type:"check",onBlur:true});
      Espruino.Options.optionFields.push({id:"#statusSoundOn",module:"Status",field:"statusSoundOn",type:"check",onBlur:true});
      Espruino.Options.optionFields.push({id:"#errorSpeakOn",module:"Status",field:"errorSpeakOn",type:"check",onBlur:true});
      Espruino.Options.optionFields.push({id:"#statusSpeakOn",module:"Status",field:"statusSpeakOn",type:"check",onBlur:true});
      Espruino.Options.optionBlocks.push({module:"Status",buttonLine:1});
    };
    Espruino.Status.sendSound = function(sound){
      var snd = "";
      if(sound === "error"){snd = "sounds/truck_horn.wav"; }
      else if(sound="status"){snd = "sounds/chime_up.wav"; }
      else {snd = "sounds/" + sound + ".wav"; }
      audioPlayer.src = snd;
    }    
    Espruino.Status.speak = function(text){
      if(Espruino.Status.getChromeVersion() >= 33){
        var msg = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(msg);
      }
    }   
    Espruino.Status.setStatus = function(text, progress) {
      console.log(">>> "+text);
      statusBox.html(text);
      if (progress === undefined) {
        progressIndicator.width(0);
        progressBox.hide();        
        progressMax = 0;
      } else {
        progressBox.show();
        if (progress<1) progress=1;
        progressAmt = 0;
        progressMax = progress;
      }
      if(Espruino.Status.statusSoundOn) {Espruino.Status.sendSound("status"); }
      if(Espruino.Status.statusSpeakOn) {Espruino.Status.speak(text); }
    };

    Espruino.Status.setError = function(text,additionalInfo) {
      var statusText = "";
      if(additionalInfo){statusText = '<button class="showErrorAdditional" info="' + additionalInfo + '">Info</button>';}
      Espruino.Status.setStatus(statusText + "ERROR:" + text);
      $(".showErrorAdditional").button({ text: false, icons: { primary: "ui-icon-info" } }).show();
      $(".showErrorAdditional").click(showAdditionalInfo);
      if(Espruino.Status.errorSoundOn) {Espruino.Status.sendSound("error");}
      if(Espruino.Status.errorSpeakOn) {Espruino.Status.speak(text);}
    };
    function showAdditionalInfo(evt){
      console.log(evt, $(this).attr("info"));
      Espruino.General.ShowSubForm("divStatusInfo",20,200,"<h3>" + $(this).attr("info") + "</h3>","#fdd","body");
    }

    Espruino.Status.hasProgress = function() {
      return progressMax>0;
    };    
    
    Espruino.Status.incrementProgress = function(amount) {
      if (!Espruino.Status.hasProgress()) return;      
      progressAmt += amount;
      var width = (progressAmt * 100.0 / progressMax)|0;
      //console.log(progressAmt,progressMax,width);
      if (width>100) width=100;
      progressIndicator.width(width);
    };
    
    Espruino.Status.getChromeVersion = function(){
      return parseInt(window.navigator.appVersion.match(/Chrome\/(.*?) /)[1].split(".")[0]);
    }
    
})();
