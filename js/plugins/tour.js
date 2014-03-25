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

  // Define slides
  var slides = [
    {
      title: "Welcome to the Espruino Web IDE",
      description: "Lorem ipsum dolar"
    },
    {
      title: "Connect to your Espruino",
      description: "Guiders are a user interface design pattern for introducing features of software. This dialog box, for example, is the first in a series of guiders that together make up a guide.",
      attachTo: "#icon-connection",
      position: "bottomLeft"
    },
    {
      title: "Welcome to the Espruino Web IDE",
      description: "Guiders are a user interface design pattern for introducing features of software. This dialog box, for example, is the first in a series of guiders that together make up a guide.",
      attachTo: "#icon-saveFile",
      position: "bottomRight"
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

    $.each(slides, function(idx, itm){

      var opts = $.extend({}, {
        id: "g"+ idx,
        overlay: true,
        isHashable: false
      }, itm);

      if(idx < slides.length - 1)
      {
        opts.next = "g"+ (idx + 1);
        opts.buttons = [{ name: "Next" }];
      }

      guiders.createGuider(opts);

    });   

    // Make sure clicking overlay hides the tour
    $("body").on("click", "#guiders_overlay", function(){
      guiders.hideAll();
    })

    // Start the tour
    function startTour()
    {
      // Check arrow offset
      $.guiders._arrowOffset = $("body").hasClass("compact") ? 5 : 20;

      // Start the tour
      guiders.show("g0");
    }
  }
  
  Espruino.Plugins.Tour = {
    init : init,
  };
}());