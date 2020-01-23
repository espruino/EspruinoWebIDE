/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Guided tour
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  // Reset guiders defaults
  $.guiders._buttonAttributes = { "href": "#" };
  $.guiders._arrowSize = 10;

  // Temp var to hold the blockly state so we can revert back
  var isInBlockly;

  // Define slides
  var slides = [
    {
      title: "Web IDE tour",
      description: "Click here for a quick tour of the new Web IDE",
      attachTo: "#icon-help",
      position: "bottomRight",
      buttons: []
    },
    // now we start the real tour
    {
      title: "Welcome to the Espruino Web IDE",
      description: "The Espruino Web IDE is designed for writing code on microcontrollers that use the <a href='http://www.espruino.com' target='_blank'>Espruino JavaScript interpreter</a><br /><br />"+
                   "To help you get up to speed quickly with the IDE, this tour will run you through some of the core features you'll need to know to get started. <br /><br />So when you are ready, click next to continue."
    },
    {
      title: "Connect to your Espruino",
      description: "The first thing you'll want to do is connect to your Espruino board by clicking the 'Connect' button.",
      attachTo: "#icon-connection",
      position: "bottomLeft"
    },
    {
      title: "Select your port",
      description: "Connect your Espruino to an available port and select the port from the list.",
      attachTo: ".window--modal",
      position: "bottom",
      onShow: function(){
        Espruino.Core.MenuPortSelector.showPortSelector();
      },
      onHide: function(){
        Espruino.Core.App.closePopup();
      }
    },
    {
      title: "Connected",
      description: "The 'Connect' button should then turn green and you are ready to go.",
      attachTo: "#icon-connection",
      position: "bottomLeft"
    },
    {
      title: "The terminal",
      description: "To send simple commands to the Espruino, simply type them in the terminal window and hit enter to send.",
      attachTo: "#terminal",
      position: "bottom",
      offset: {
        top: -300,
        left: null
      }
    },
    {
      title: "The code editor",
      description: "To send more complex blocks of javascript, write them in the code editor window...",
      attachTo: "#divcode",
      position: "bottom",
      offset: {
        top: -300,
        left: null
      },
      onShow: function(){
        isInBlockly = Espruino.Core.Code.isInBlockly();
        if(isInBlockly){
          Espruino.Core.Code.switchToCode();
        }
      },
      onHide: function(){
        if(isInBlockly)
          Espruino.Core.Code.switchToBlockly();
      }
    },
    {
      title: "The block editor",
      description: "...or switch to the block editor and use 'Scratch' like code blocks...",
      attachTo: "#icon-code",
      position: "topRight",
      onShow: function(){
        isInBlockly = Espruino.Core.Code.isInBlockly();
        if(!isInBlockly){
            Espruino.Core.Code.switchToBlockly();
        }
      },
      onHide: function(){
        if(!isInBlockly)
          Espruino.Core.Code.switchToCode();
      }
    },
    {
      title: "Deploying your code",
      description: "...then when your are ready, upload it to your Espruino by clicking the 'Deploy' button.",
      attachTo: "#icon-deploy",
      position: "left"
    },
    {
      title: "Go wild!",
      description: "And those are the basics of the Espruino Web IDE.<br /><br />For more helpful guides and tutorials, be sure to check out the <a href='http://www.espruino.com/Tutorials' target='_blank'>Tutorials</a> section on the Espruino website, or if you have any questions, why not head on over to the <a href='http://forum.espruino.com/' target='_blank'>Forums</a>.<br /><br />We hope you enjoy your Espruino!"
    }
  ];

  function init() {

    // When finding an icon, you need to make sure your plugin
    // comes after the inital icon module.
    var icon = Espruino.Core.App.findIcon("help");
    if(icon) {
      icon.addMenuItem({
        id: "tour",
        icon: "compass",
        title: "Tour",
        order: 2,
        click: function(){
          startTour();
        }
      });
    }
    prepareSlides("g", slides);

    // Make sure clicking overlay hides the tour
    $("body").on("click", "#guiders_overlay", function(){
      guiders.hideAll();
    });

    // Start the tour
    function startTour()
    {
      // Check arrow offset
      $.guiders._arrowOffset = $("body").hasClass("compact") ? 5 : 20;

      // Start the tour
      guiders.show("g1");
    }


    // If this is our first run, prompt about the Tour
    Espruino.addProcessor("initialised", function(data, callback) {
      if (!Espruino.Config.NOT_FIRST_RUN) {
        Espruino.Config.set("NOT_FIRST_RUN", true);
        guiders.show("g0");
      }

      callback(data);
    });
  }
  function prepareSlides(slideId,slides){
    $.each(slides, function(idx, itm){
      switch(itm.onHide){
        case "clickAttached":
          itm.onHide = function(){$(itm.attachTo).click();};
          break;
        case "clickElement":
          itm.onHide = function(){$(itm.element).click();};
          break;
        case "closePopup":
          itm.onHide = function(){Espruino.Core.App.closePopup();};
          break;
        case "sendBoard":
          itm.onHide = function(){Espruino.Core.Serial.write(itm.source);};
          break;
        case "sendEditor":
          itm.onHide = function(){Espruino.Core.EditorJavaScript.setCode(itm.source);};
          break;
        case "sendAttached":
          itm.onHide = function(){
            switch(getInputType($(itm.attachTo))){
              case "text":
                $(itm.attachTo).val(itm.source);
                break;
              case "checkbox":
                if($(itm.attachTo).prop("checked") != itm.source){
                  $(itm.attachTo).click();
                }
                break;
              case "select":
                $(itm.attachTo).val(itm.source);
                break;
              default:
                break;
            }
          }
          break;
      }
      var opts = $.extend({}, {
        id: slideId + idx,
        overlay: true,
        isHashable: false
      }, itm);
      if(idx < slides.length - 1){
        opts.next = slideId + (idx + 1);
        if(opts.buttons == undefined){
          opts.buttons = [{ name: "Next" }];
        }
      }
      if(!guiders.get(opts.id)) { guiders.createGuider(opts); }
    });
  }
  function runTour(tourUrl){
    $.getJSON(tourUrl,function(tour){
      if (tour.needsConnection && !Espruino.Core.Serial.isConnected()) {
        var popup = Espruino.Core.App.openPopup({
          title: "Tour can't run",
          padding: true,
          contents: '<p>This tour needs a connection to an Espruino board</p>'+
                    '<p>Please connect your board and then click the \'Connect\' icon in the top right</p>' ,
          position: "center",
          buttons : [{ name:"Ok", callback : function() { Espruino.Core.App.closePopup(); }}]
        });
      } else if (tour.needsProjectSetting && !Espruino.Config.projectEntry) {
        var popup = Espruino.Core.App.openPopup({
          title: "Tour can't run",
          padding: true,
          contents: '<p>This tour needs a Project directory to be defined.</p>'+
                    '<p>Please go to <b>Settings</b>, then <b>Project</b>, and follow the <b>Project Tour</b>.</p>' ,
          position: "center",
          buttons : [{ name:"Ok", callback : function() { Espruino.Core.App.closePopup(); }}]
        });
      } else if (tour.needsTestingSetting && !Espruino.Config.ENABLE_Testing) {
        var popup = Espruino.Core.App.openPopup({
          title: "Tour can't run",
          padding: true,
          contents: '<p>This tour needs Testing to be enabled.</p>'+
                    '<p>Please go to <b>Settings</b>, then <b>Testing</b>, and follow the <b>Testing Tour</b>.</p>' ,
          position: "center",
          buttons : [{ name:"Ok", callback : function() { Espruino.Core.App.closePopup(); }}]
        });
      } else {
        prepareSlides(tour.id, tour.slides);
        guiders.show(tour.id + "1");
      }
    });
  }
  function addTourButton(tourUrl){
    var icon = Espruino.Core.App.findIcon("help");
    if(icon) {
      $.getJSON(tourUrl,function(slide){
        icon.addMenuItem({
          id: slide.buttonid,
          icon: "compass",
          title: slide.title,
          order: 3,
          click: function(){
            runTour(tourUrl);
          }
        });
      });
    }
  }
  function getInputType(x) {
    return x[0].tagName.toString().toLowerCase() === "input" ?
      $(x).prop("type").toLowerCase() : x[0].tagName.toLowerCase();
  };
  Espruino.Plugins.Tour = {
    init : init,
    runTour : runTour,
    addTourButton : addTourButton
  };
}());
