/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Settings Page for the Espruino Flasher
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  function init() {
    Espruino.Core.Config.addSection("Flasher", {
      description : "This allows you to update the Espruino Firmware that is on your board",
      sortOrder : 10000,
      getHTML : function(callback) {
        $.get("data/settings_flasher.html", function(data) {
          callback(data);

          // Set up warning
          var chromeVer = navigator.userAgent.replace(/.*Chrome\/([0-9]*).*/,"$1");
          if (chromeVer < 32) {
            // 32 should work, but if they're going to upgrade let's suggest 33 :)
            var info = "Your Chrome version is "+chromeVer+". Please upgrade it to 33 or newer before trying to flash your Espruino board."
            $(".flash_info").css("color","red").html(info);
          }

          // Start button
          $('.flash_start').click( function() {
            Espruino.Core.App.closePopup();
            Espruino.Core.MenuFlasher.showFlasher();
          });
          // Advanced start
          $('.flash_start_url').click( function() {
            var url = $('.flash_url').val();
            if (url!="") {
              Espruino.Core.App.closePopup();
              Espruino.Core.MenuFlasher.showFlasher( url );
            }
          });
          $('.flash_start_file').click( function() {
            Espruino.Core.Utils.fileOpenDialog({
                id:"flasher",
                type:"arraybuffer",
                mimeType:".bin,.zip,application/zip"},function(buffer) {
              Espruino.Core.App.closePopup();
              Espruino.Core.MenuFlasher.showFlasher( undefined, buffer );
            });
          });
          // Espruino WiFi flash
          $('.espruino_wifi_fw_check').click( checkWiFiFirmware );
          $('.espruino_wifi_fw_start').click( flashWiFiFirmware );
        });
      }
    });
  }

  function checkWiFiFirmware() {
    Espruino.Core.MenuPortSelector.ensureConnected(function() {
      Espruino.Core.Status.showStatusWindow("Espruino WiFi","Checking firmware version...");
      Espruino.Core.FlasherESP8266.getFirmwareVersion(version => {
        Espruino.Core.Status.hideStatusWindow();
        var popup = Espruino.Core.App.openPopup({
          title: "Espruino WiFi",
          padding: true,
          contents: version ? `<p><b>The WiFi firmware reported:</b></p><p><pre>${Espruino.Core.Utils.escapeHTML(version)}</pre></p>`:
                            `<p><b>The ESP8266 did not respond to the version request</b></p>`,
          position: "center",
          buttons : [{ name:"Ok", callback : function() {
            popup.close();
          }}]
        });
      });
    });
  }

  function flashWiFiFirmware() {
    var BIN = "ESP8266_AT_1_5_4_8M";
    var URL = "https://www.espruino.com/binaries/"+BIN+".bin";
    Espruino.Core.App.closePopup();
    var popup = Espruino.Core.App.openPopup({
      title: "Espruino WiFi ESP8266 Firmware Update",
      padding: true,
      contents: `<p>This option will update your Espruino WiFi's ESP8266 WiFi
    module to the latest version (${BIN}). This will take several minutes, and should not be stopped
    halfway. <b>Espruino WiFi should not be in bootloader mode when you connect.</b></p>`,
      position: "auto",
      buttons : [{ name:"Next", callback : function() {
        popup.close();
        Espruino.Core.Status.showStatusWindow("Firmware Update","ESP8266 firmware is now being updated...");
        Espruino.Core.Status.setStatus("Downloading binary...");
        Espruino.Core.Utils.getBinaryURL(URL, function (err, binary) {
          if (err) {
            Espruino.Core.Status.hideStatusWindow();
            Espruino.Core.Notifications.error("Unable to download binary: "+ err, true);
            return;
          }
          console.log("Downloaded "+binary.byteLength+" bytes");
          Espruino.Core.MenuPortSelector.ensureConnected(function() {
            Espruino.Core.FlasherESP8266.flashDevice({
              binary : binary,
              cbStatus : function(txt,progress) {
                Espruino.Core.Status.setStatus(txt);
              },
              cbDone : function() {
                Espruino.Core.Status.hideStatusWindow();
                var popup = Espruino.Core.App.openPopup({
                  title: "Firmware Update",
                  padding: true,
                  contents: '<p><b>The Firmware was updated successfully!</b><p>',
                  position: "center",
                  buttons : [{ name:"Next", callback : function() {
                    popup.close();
                  }}]
                });
              }
            });
          });
        });
      }},{ name:"Close", callback : function() {
        popup.close();
      }}]
    });

  }

  Espruino.Core.SettingsFlasher = {
    init : init,
  };
}());
