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

  var isFlashing = false; // are we currently trying to update flash?

  function init() {
  }

  function showFlasher(urlOrNothing) {
    if (urlOrNothing) urlOrNothing = urlOrNothing.trim();
    if (urlOrNothing=="") urlOrNothing=undefined;

    if (!urlOrNothing) {
      var env = Espruino.Core.Env.getData();
      if (env!==undefined &&
          env.info!==undefined &&
          env.info.binary_url!==undefined) {
        var flashFn = getBoardFlashingFunction(env.BOARD);
        if (!flashFn) return;
        var flashInfo = {
              binary_url : urlOrNothing,
              board_id : env.BOARD,
              board_info : env.info,
              board_chip : env.chip,
              flashFn : flashFn,
            };
        stepSelectBinary(flashInfo);
        return;
      }
    }

    stepSelectBoard(urlOrNothing);
  }

  function getBoardFlashingFunction(boardId) {
    var msg;
    if (["PUCKJS","PIXLJS","MDBT42Q","RUUVITAG"].indexOf(boardId)>=0) {
      if (navigator && navigator.bluetooth &&
          !(window && window.location && window.location.protocol=="http:"))
        return stepFlashNordicDFU;
      else
        msg = '<p>The firmware for this device can only be written via Web Bluetooth (or a phone app). See the device\'s reference page for more information.</p>';
    } else if (["PICO_R1_3","ESPRUINOBOARD","ESPRUINOWIFI"].indexOf(boardId)>=0) {
      return stepFlashSTM32;
    } else {
      msg = '<p>The firmware for this device can\'t be updated from the IDE at the moment.</p>';
    }
    var popup = Espruino.Core.App.openPopup({
      title: "Firmware Update",
      padding: true,
      contents: msg,
      position: "center",
      ok : function() {
        popup.close();
      }
    });
    return undefined;
  }

  function stepSelectBoard( urlOrNothing ) {
    var boardList;

    var popup = Espruino.Core.App.openPopup({
      title: "Firmware Update",
      padding: true,
      contents: '<p>We need to find out which board you have. Please select from the list below and click next...</p>'+
                '<div class="board_list">Loading...</div>'+
                '<p>If you don\'t see your board here, you can\'t update the firmware on it from the IDE. Please click outside this window to close it, and <a href="http://www.espruino.com/Download" target="_blank">see the download page</a> for more instructions.</p>' ,
      position: "center",
      next : function() {
        var boardId = $('.board_list option:selected').attr("name");
        popup.close();
        if (boardId===undefined || boardList[boardId]===undefined)
          console.error("No board ID found! Looks like no option selected");
        else {
          var flashFn = getBoardFlashingFunction(boardId);
          if (flashFn) {
            var boardJson = boardList[boardId]["json"];
            var flashInfo = {
              binary_url : urlOrNothing,
              board_id : boardId,
              board_info : boardJson.info,
              board_chip : boardJson.chip,
              flashFn : flashFn };
            if (urlOrNothing)
              stepDownload( flashInfo );
            else
              stepSelectBinary( flashInfo );
          }
        }
      }
    });

    Espruino.Core.Env.getBoardList(function(data) {
      var html = "<red>Error loading boards...</red>";
      if (data) {
        boardList = data;
        html = "<select>";
        for (var boardId in data) {
          var boardJson = data[boardId]["json"];
          if (boardJson.info.bootloader) {
            //html += '<img src="data:image/png;base64,'+data[boardId]["thumb_b64"]+'" alt="'+boardId+'"/>';
            try {
              html += '  <option name="'+boardId+'">'+boardJson.info.name+'</option>';
            } catch (e) {
              console.warn(e);
            }
          }
        }
        html += "</select>";
      }

      $(".board_list").html(html);
    });

  }

  // flashInfo = { binary_url, board_id, board_info, board_chip, flashFn }
  function stepSelectBinary(flashInfo) {
    var binaries = flashInfo.board_info.binaries;
    var base_url = flashInfo.board_info.binary_url;
    // Old-style, and just one firmware image - go to next!
    if (binaries===undefined) {
      flashInfo.binary_url = base_url;
      stepDownload( flashInfo );
      return;
    }
    // New style
    base_url = base_url.substr(0,base_url.lastIndexOf("/")+1);
    // Just one...
    if (binaries.length==1) {
      flashInfo.binary_url = base_url+binaries[0]["filename"].replace("%v", flashInfo.board_info["binary_version"]);
      stepDownload( flashInfo );
      return;
    }
    // More than one...
    // Make a list
    var html = "<select class=\"fw_list\">";
    for (var i in binaries) {
      try {
        html += '  <option name="'+i+'" filename="'+binaries[i]["filename"]+'">'+binaries[i]["description"]+'</option>';
      } catch (e) {
        console.warn(e);
      }
    }
    html += "</select>";
    // Create popup
    var popup = Espruino.Core.App.openPopup({
      title: "Firmware Update",
      padding: true,
      contents: '<p>Your board has multiple options for firmware. Please select from the list below and click next...</p>'+
                '<p><b>Note:</b> If you don\'t need any of the features listed, you can choose any firmware.</p>'+
                html,
      position: "center",
      next : function() {
        var binary_filename = $('.fw_list option:selected').attr("filename");
        popup.close();
        if (binary_filename===undefined)
          console.error("No binary filename found! Looks like no option selected");
        else {
          flashInfo.binary_url = base_url+binary_filename.replace("%v", flashInfo.board_info.binary_version);
          console.log("Choosing "+flashInfo.binary_url);
          stepDownload( flashInfo );
        }
      }
    });

  }

  // data = { binary_url, board_id, board_info, board_chip, flashFn }
  function stepDownload(data) {
    if (window && window.location &&
        window.location.protocol=="https:" &&
        data.binary_url.substr(0,5)=="http:")
      data.binary_url = "https:"+data.binary_url.substr(5);
    data.flashFn(data);
  }

  // ===========================================================================
  // data = { binary_url, board_id, board_info, board_chip, flashFn }
  function stepFlashSTM32(data) {
    Espruino.Core.Utils.getBinaryURL(data.binary_url, function (err, binary) {
      if (err) return stepError("Unable to download "+data.binary_url);
      data.binary = binary;
      Espruino.Core.MenuPortSelector.disconnect();
      var popup = Espruino.Core.App.openPopup({
        title: "Firmware Update",
        padding: true,
        contents: "<p>Firmware downloaded successfully.</p>"+getDocs(data, "reset"),
        position: "center",
        next : function() {
          popup.close();
          stepFlashSTM32_2(data);
        }
      });
    });
  }

  // data = { binary, binary_url, board_id, board_info, board_chip, flashFn }
  function stepFlashSTM32_2(data) {
    isFlashing = true;
    Espruino.Core.MenuPortSelector.ensureConnected(function() {
      console.log("stepFlashSTM32: ",data);
      var flashOffset = data.board_chip.place_text_section;
      var popup = stepShowProgress();

      Espruino.Core.Flasher.flashBinaryToDevice(data.binary, flashOffset, function (err) {
        isFlashing = false;
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
          stepSuccess(data);
        }
      }, function(status) {
        popup.setStatus(status);
      });
    });
  }
  // ===========================================================================
  function SecureDfuPackage(buffer) {
      this.buffer = buffer;
      this.zipFile = null;
      this.manifest = null;
  };

  SecureDfuPackage.prototype.load = function() {
    var that = this;
    return JSZip.loadAsync(this.buffer)
    .then(function(zipFile) {
        that.zipFile = zipFile;
        try {
            return that.zipFile.file("manifest.json").async("string");
        } catch(e) {
            throw new Error("Unable to find manifest, is this a proper DFU package?");
        }
    })
    .then(function(content) {
        that.manifest = JSON.parse(content).manifest;
        return that;
    });
  };

  SecureDfuPackage.prototype.getImage = function(types) {
    var that = this;
    for (var type of types) {
      if (this.manifest[type]) {
        var entry = this.manifest[type];
        var result = {
            type: type,
            initFile: entry.dat_file,
            imageFile: entry.bin_file
        };

        return this.zipFile.file(result.initFile).async("arraybuffer")
        .then(function(data) {
            result.initData = data;
            return that.zipFile.file(result.imageFile).async("arraybuffer")
        }).then(function(data) {
            result.imageData = data;
            return result;
        });
      }
    }
  };

  SecureDfuPackage.prototype.getBaseImage = function() {
      return this.getImage(["softdevice", "bootloader", "softdevice_bootloader"]);
  };

  SecureDfuPackage.prototype.getAppImage = function() {
      return this.getImage(["application"]);
  };


  // data = { binary_url, board_id, board_info, board_chip, flashFn }
  function stepFlashNordicDFU(data) {
    /* Hack because we have different binaries - hex and zip - depending
    on how firmware is written. We need zips for Nordic DFU */
    data.binary_url = data.binary_url.replace(/\.hex$/,".zip");
    Espruino.Core.Utils.getBinaryURL(data.binary_url, function (err, binary) {
      if (err) return stepError("Unable to download "+data.binary_url);
      data.binary = binary;

      data.firmwarePackage = new SecureDfuPackage(data.binary);
      data.firmwarePackage.load().then(function() {
        Espruino.Core.MenuPortSelector.disconnect();
        var popup = Espruino.Core.App.openPopup({
          title: "Firmware Update",
          padding: true,
          contents: "<p>Firmware downloaded successfully.</p>"+getDocs(data, "reset"),
          position: "center",
          next : function() {
            popup.close();
            stepFlashNordicDFU_2(data);
          }
        });
      }).catch(function(error) {
        stepError(error);
      });
    });

  }

  // data = { binary, binary_url, board_id, board_info, board_chip, flashFn }
  function stepFlashNordicDFU_2(data) {
    console.log("stepFlashNordicDFU: ",data);
    function setStatus(x) {
      Espruino.Core.Notifications.success(x, true);
      if (!Espruino.Core.Status.hasProgress())
        Espruino.Core.Status.setStatus(x);
      popup.setStatus(x);
    }
    // Actually start DFU
   const dfu = new SecureDfu(/* no CRC32 - no validation */);
   var popup = stepShowProgress();
   if (!Espruino.Core.Status.hasProgress())
     Espruino.Core.Status.setStatus("Initialising...");

   dfu.addEventListener("log", function(event) {
       console.log(event.message);
   });
   var lastProgress;
   dfu.addEventListener("progress", function(state) {
     var progress = state.currentBytes / state.totalBytes;
     if (lastProgress===undefined) {
       Espruino.Core.Status.setStatus("Uploading...", 1);
     } else {
       Espruino.Core.Status.incrementProgress(progress - lastProgress)
     }
     lastProgress = progress;
   });
   dfu.requestDevice(true).then(function(device) {
       if (!device) {
           setStatus("DFU mode set, select device again");
           return;
       }
       return Promise.resolve().then(function() {
         return data.firmwarePackage.getBaseImage();
       }).then(function(image) {
           if (image) {
               setStatus(`Updating ${image.type}: ${image.imageFile}...`);
               return dfu.update(device, image.initData, image.imageData);
           }
       }).then(function() {
         return data.firmwarePackage.getAppImage();
       }).then(function(image) {
           if (image) {
               setStatus(`Updating ${image.type}: ${image.imageFile}...`);
               return dfu.update(device, image.initData, image.imageData);
           }
       })
   }).then(function() {
     popup.close();
     stepSuccess(data);
   }).catch(function(error) {
     popup.close();
     stepError(error);
   });
  }

  // ===========================================================================
  // ===========================================================================
  function stepShowProgress() {
    var popup = Espruino.Core.App.openPopup({
      title: "Firmware Update",
      padding: true,
      contents: '<div class="status__progress" style="width:100%;margin-top:10px;"><div class="status__progress-bar" /></div>'+
                '<p><b>Your firmware is now being updated</b>... <span class="flash_status"></span></p>',
      position: "center",
    });
    popup.setStatus = function(x) {
      var s = document.getElementsByClassName("flash_status");
      if (s.length) s[0].innerHTML = Espruino.Core.Utils.escapeHTML(x);
    };
    return popup;
  }

  function stepSuccess(data) {
    var popup = Espruino.Core.App.openPopup({
      title: "Firmware Update",
      padding: true,
      contents: '<p><b>The Firmware was updated successfully!</b><p>'+
                getDocs(data, "success"),
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

  function getDocs(data, doc) {
    var html = undefined;
    if (doc=="reset") {
      if (data.board_id.substr(0,4)=="PICO" ||
          data.board_id=="ESPRUINOWIFI") {
        html =
          '<p><b>Please put your board into bootloader mode.</b> Hold down the button, plug into USB, and then immediately release it.</p>'+
          '<p>When the red and green LEDs start pulsing on and off, click <b>Next</b>...</p>'+
          '<p>If the LEDs are not pulsing, please see the <a href="http://www.espruino.com/Troubleshooting" target="_blank">Troubleshooting page</a></p>';
      } else if (data.board_id=="ESPRUINOBOARD") {
        html =
          '<p><b>Please put your board into bootloader mode.</b> Hold down BTN1, press and release RST, then release BTN1.</p>'+
          '<p>When the blue LED starts pulsing on and off, click <b>Next</b>...</p>'+
          '<p>If the blue LED is not pulsing, please see the <a href="http://www.espruino.com/Troubleshooting" target="_blank">Troubleshooting page</a></p>';
      } else {  // General instructions
        html =
          '<p><b>Please put your board into bootloader mode.</b> Hold down BTN1, power cycle it, and release BTN1 immediately.</p>'+
          '<p>An LED should light to indicate bootloader mode - click <b>Next</b>...</p>'+
          '<p>If no LED is lit, please see the <a href="http://www.espruino.com/Troubleshooting" target="_blank">Troubleshooting page</a> and the instructions for your board.</p>';
      }
    } else if (doc=="success") {
      if (data.board_id.substr(0,4)=="PICO"  ||
          data.board_id=="ESPRUINOWIFI") {
        html =
          '<p>Please unplug the board and plug it back in to exit bootloader mode, then click <b>Next</b> to start using it!</p>';
      } else if (data.board_id=="ESPRUINOBOARD") {
        html =
          '<p>Please press the RST button to reset the Espruino out of bootloader mode, then click <b>Next</b> to start using it!</p>';
      } else { // General instructions
        html =
          '<p>Please power cycle your board to exit bootloader mode, then click <b>Next</b> to start using it!</p>';
      }
    }
    if (!html) {
      html = "Couldn't find documentation"
      console.warn("Unknown doc type '"+doc+"' for board '"+data.board_id+"'");
    }
    return html;
  }

  Espruino.Core.MenuFlasher = {
      init : init,
      showFlasher : showFlasher,
      isFlashing : function() { return isFlashing; } // are we currently trying to update flash?
  };

}());
