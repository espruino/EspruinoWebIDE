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
    Espruino.Core.Config.addSection("Sound", {
      sortOrder:600, description: "Play notification sounds or speak for certain events"
    });
    
    var soundTypes = {
        "":"None",
        "doorbell2":"Doorbell",
        "trolley2":"Trolley",
        "sirens_x":"Siren",
        "truck_horn":"Truck horn",
        "car_horn_x":"Car horn",
        "warning_horn":"Warning horn",
        "boxing_bell":"Boxing Bell",
        "phone_ring_old":"Phone ring"
    };
    Espruino.Core.Config.add("Sound_Success",{
      section : "Sound",name: "Sound for Success",description: "Defines sound for Success",
      type : soundTypes, defaultValue : ""
    });
    Espruino.Core.Config.add("Sound_Warning",{
      section : "Sound",name: "Sound for Warnings",description: "Defines sound for Warnings",
      type : soundTypes, defaultValue : ""
    });
    Espruino.Core.Config.add("Sound_Error",{
      section : "Sound",name: "Sound for Errors",description: "Defines sound for Errors",
      type : soundTypes, defaultValue : ""
    });
    Espruino.Core.Config.add("Sound_Info",{
      section : "Sound",name: "Sound for Info",description: "Defines sound for Infos",
      type : soundTypes, defaultValue : ""
    });
    Espruino.Core.Config.add("Speak_Success",{
      section : "Sound",name:"Speak sucess",description: "Speak message for success",
      type: "boolean",defaultValue: false
    }); 
    Espruino.Core.Config.add("Speak_Warning",{
      section : "Sound",name: "Speak warning",description: "Speak message for warning",
      type: "boolean",defaultValue: false
    }); 
    Espruino.Core.Config.add("Speak_Error",{
      section : "Sound",name: "Speak error",description: "Speak message for sound",
      type: "boolean",defaultValue: false
    }); 
    Espruino.Core.Config.add("Speak_Info",{
      section : "Sound",name: "Speak info",description: "Speak message for info",
      type: "boolean",defaultValue: false
    }); 
    Espruino.addProcessor("notification", function (data, callback) {
      var snd;
      switch(data.type){
        case "success": snd = Espruino.Config.Sound_Success; break;
        case "error": snd = Espruino.Config.Sound_Error; break;
        case "warning": snd = Espruino.Config.Sound_Warning; break;
        case "info": snd = Espruino.Config.Sound_Info; break;
      }
      if(snd && snd !== ""){ sendSound(snd);}
      
      switch(data.type){
        case "success": if(Espruino.Config.Speak_Success){ speak(data.msg); } break;
        case "error": if(Espruino.Config.Speak_Error){ speak(data.msg); } break;
        case "warning": if(Espruino.Config.Speak_Warning){ speak(data.msg); } break;
        case "info": if(Espruino.Config.Speak_Info){ speak(data.msg); } break;
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