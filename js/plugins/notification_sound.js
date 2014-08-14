/**
 Copyright 2014 Juergen Marsch (juergenmarsch@googlemail.com)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Testing Plugin
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  var audioPlayer;
  function init() {
    audioPlayer = new Audio("");
    document.body.appendChild(audioPlayer);
    audioPlayer.addEventListener('canplay', function() { audioPlayer.play(); }, false);
    Espruino.Core.Config.addSection("sound", {
      sortOrder:600, description: "Sound page"
    });
    Espruino.Core.Config.add("ENABLE_Sound", {
      section : "sound", name : "Enable Sound (BETA)", description : "This enables sound on notifications",
      type : "boolean", defaultValue : false,
    });
    Espruino.Core.Config.add("ENABLE_Speak", {
      section : "sound", name : "Enable speak (BETA)", description : "This enables speak for notifications",
      type : "boolean", defaultValue : false,
    });
    Espruino.Core.Config.add("Sound_Success",{
      section: "sound",name: "Sound for Success",description: "Defines sound for Success",
      type: {"":"none","doorbell2":"Doorbell","trolley2":"trolley"},defaultValue : "none"
    });
    Espruino.Core.Config.add("Sound_Warning",{
      section: "sound",name: "Sound for Warnings",description: "Defines sound for Warnings",
      type: {"":"none","car_horn_x":"Car horn","warning_horn":"Warning horn"},defaultValue : "car_horn_x"
    });
    Espruino.Core.Config.add("Sound_Error",{
      section: "sound",name: "Sound for Errors",description: "Defines sound for Errors",
      type: {"":"none","sirens_x":"Siren","truck_horn":"Truck horn"},defaultValue : "sirens_x"
    });
    Espruino.Core.Config.add("Sound_Info",{
      section: "sound",name: "Sound for Info",description: "Defines sound for Infos",
      type: {"":"none","boxing_bell":"Boxing Bell","phone_ring_old":"Phone ring"},defaultValue : "none"
    });
    Espruino.Core.Config.add("Speak_Success",{
      section: "sound",name:"Speak sucess",description: "Speak message for success",
      type: "boolean",defaultValue: false
    }); 
    Espruino.Core.Config.add("Speak_Warning",{
      section: "sound",name: "Speak warning",description: "Speak message for warning",
      type: "boolean",defaultValue: true
    }); 
    Espruino.Core.Config.add("Speak_Error",{
      section: "sound",name: "Speak error",description: "Speak message for sound",
      type: "boolean",defaultValue: true
    }); 
    Espruino.Core.Config.add("Speak_Info",{
      section: "sound",name: "Speak info",description: "Speakmessage for info",
      type: "boolean",defaultValue: false
    }); 
    Espruino.addProcessor("notification", function (data, callback) {
      var snd;
      if(Espruino.Config.ENABLE_Sound){
        switch(data.type){
          case "success": snd = Espruino.Config.Sound_Success; break;
          case "error": snd = Espruino.Config.Sound_Error; break;
          case "warning": snd = Espruino.Config.Sound_Warning; break;
          case "info": snd = Espruino.Config.Sound_Info; break;
        }
        if(snd && snd !== ""){ sendSound(snd);}
      }
      if(Espruino.Config.ENABLE_Speak){
        switch(data.type){
          case "success": if(Espruino.Config.Speak_Success){ speak(data.msg); } break;
          case "error": if(Espruino.Config.Speak_Error){ speak(data.msg); } break;
          case "warning": if(Espruino.Config.Speak_Warning){ speak(data.msg); } break;
          case "info": if(Espruino.Config.Speak_Info){ speak(data.msg); } break;
        }
      }
      callback(data);
    });

  }
  function sendSound(sound){
    var snd = "";
    snd = "data/sounds/" + sound + ".wav";
    audioPlayer.src = snd;
  }
  function speak(text){
    if(Espruino.Core.Utils.getChromeVersion() >= 33){
      var msg = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(msg);
    }
  }   
    
  Espruino.Plugins.Notification_Sound = {
    init : init,
    sendSound : sendSound,
    speak : speak
  };
})();