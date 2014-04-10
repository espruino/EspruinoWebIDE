/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Step by step flasher
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
  }

  function showFlasher(urlOrNothing) {
    if (urlOrNothing) urlOrNothing = urlOrNothing.trim();
    if (urlOrNothing=="") urlOrNothing=undefined;
    
    if (!urlOrNothing) {
      var env = Espruino.Core.Env.getData();
      if (env!==undefined &&
          env.info!==undefined &&
          env.info.binary_url!==undefined) 
        urlOrNothing = env.info.binary_url;
    }     
    
    if (urlOrNothing) {
      stepReset( { binary_url : urlOrNothing } );
    } else {
      stepSelectBoard();
    }
  }
  
  function stepSelectBoard() {
    var popup = Espruino.Core.App.openPopup({
      title: "Firmware Update",
      padding: true,
      contents: '<p>We need to find out which board you have. Please select from the list below and click next...</p>'+
                '<div class="board_list">Loading...</div>'+
                '<p>If you don\'t see your board here, you can\'t update the firmware on it from the IDE. Please click outside this window to close it, and <a href="http://www.espruino.com/Download" target="_blank">see the download page</a> for more instructions.</p>' ,                
      position: "center",
      next : function() {
        var binary_url = $('option:selected').attr("url");
        popup.close();
        stepReset( { binary_url : binary_url } );
      }
    });
    
    Espruino.Core.Env.getBoardList(function(data) {
      var html = "<red>Error loading boards...</red>";      
      if (data) {
        html = "<select>";
        for (var boardId in data) {
          //if (data[boardId]["json"]["info"]["serial_bootloader"]) {
          if (boardId.indexOf("ESPRUINO")>=0) { // currently the flasher doesn't flash other boards properly because it starts at 0x08002800
            //html += '<img src="data:image/png;base64,'+data[boardId]["thumb_b64"]+'" alt="'+boardId+'"/>';
            html += '  <option name="'+boardId+'" url="'+data[boardId]["json"]["info"]["binary_url"]+'">'+data[boardId]["json"]["info"]["name"]+'</option>';
          }
        }
        html += "</select>";
      }
      
      $(".board_list").html(html);
    });
    
  }

  
  function stepReset(data) {
    Espruino.Core.MenuPortSelector.disconnect();
    
    var popup = Espruino.Core.App.openPopup({
      title: "Firmware Update",
      padding: true,
      contents: '<p><b>Please put your board into bootloader mode.</b> On Espruino boards, hold down BTN1, and then press and release RST.</p>'+
                '<p>When the blue LED starts pulsing on and off, click \'Next\'...</p>'+
                '<p>If the blue LED is not pulsing, please see the <a href="http://www.espruino.com/Troubleshooting" target="_blank">Troubleshooting page</a></p>',                
      position: "center",
      next : function() {
        popup.close();
        stepFlash(data);
      }
    });
  }
  
  function stepFlash(data) {
    Espruino.Core.MenuPortSelector.ensureConnected(function() {
      console.log(data);
      var url = data.binary_url;
      
      var popup = Espruino.Core.App.openPopup({
        title: "Firmware Update",
        padding: true,
        contents: '<p><b>Your firmware is now being updated</b>...</p>'+
                  '<p>See the status bar below to find out what\'s happening...</p>' ,                
        position: "center",
      });
    
      Espruino.Core.Flasher.flashDevice(url ,function (err) {
        Espruino.Core.Terminal.grabSerialPort();
        Espruino.Core.MenuPortSelector.disconnect();
        popup.close();
        if (err) {
          Espruino.Core.Notifications.error("Error Flashing: "+ err, true);        
          console.log(err);
          stepError(err);
        } else {        
          Espruino.Core.Notifications.success("Flashing Complete", true);
          Espruino.callProcessor("flashComplete");
          stepSuccess();
        }
      });
    });
  }
  
  function stepSuccess() {
    var popup = Espruino.Core.App.openPopup({
      title: "Firmware Update",
      padding: true,
      contents: '<p><b>The Firmware was updated successfully!</b><p>'+
                '<p>Please press the RST button to reset the Espruino device out of bootloader mode, and click Next to start using it!</p>' ,                
      position: "center",
      next : function() {
        popup.close();
      }
    });
  }  
  
  function stepError(err) {
    var popup = Espruino.Core.App.openPopup({
      title: "Firmware Update",
      padding: true,
      contents: '<p><b>Sorry, the firmware update has failed.</b></p>'+
                '<p>The error was: <i>'+err+'</i></p>'+
                '<p>Please try again, or check out the <a href="http://www.espruino.com/Troubleshooting" target="_blank">Troubleshooting page</a> for what to do next.</p>',                
      position: "center",
      next : function() {
        popup.close();
      }
    });
  }  
  
  Espruino.Core.MenuFlasher = {
      init : init,
      
      showFlasher : showFlasher
  };

}());
