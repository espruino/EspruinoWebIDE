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
    Espruino.Core.Status.statusSoundOn = false;
    Espruino.Core.Status.errorSoundOn = false;    
    Espruino.Core.Status.statusSpeakOn = false;
    Espruino.Core.Status.errorSpeakOn = false;    
    var statusBox, progressBox, progressIndicator,audioPlayer;

    
    Espruino.Core.Status.init = function(){
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
    Espruino.Core.Status.sendSound = function(sound){
      var snd = "";
      if(sound === "error"){snd = "sounds/truck_horn.wav"; }
      else if(sound="status"){snd = "sounds/chime_up.wav"; }
      else {snd = "sounds/" + sound + ".wav"; }
      audioPlayer.src = snd;
    }    
    Espruino.Core.Status.speak = function(text){
      if(Espruino.Core.Utils.getChromeVersion() >= 33){
        var msg = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(msg);
      }
    }   

    

    
})();
