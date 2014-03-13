/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Simple Layout code
 ------------------------------------------------------------------
**/
"use strict";

(function() {
  
  // handle layout
  function doLayout() {
    var w = $(window).innerWidth();
    var splitx = $(".splitter .divider").position().left;
    var splitw = $(".splitter .divider").width();
    var leftWidth = splitx;
    var rightWidth = w-(splitx+splitw);
    var h = $(window).innerHeight() - ($("#toolbar").outerHeight()+3);
    $(".splitter").height(h);
    $(".splitter").children().height(h);

    $(".splitter .left").css({"left":"0px" , "width":leftWidth+"px" });
    $("#toolbar .left").css({"left":"0px" , "width":leftWidth+"px" });
    $("#terminal").css({ "width":leftWidth, "height":h });
    $("#videotag").css({ "width":leftWidth, "height":h });

    $(".splitter .right").css({"left":(splitx+splitw)+"px" , "width":rightWidth+"px"});
    $("#toolbar .right").css({"left":(splitx+splitw)+"px", "width":rightWidth+"px"});
    $("#divcode").css({ "width":rightWidth, "height":h });     
    $("#divblockly").css({ "width":rightWidth, "height":h });      
  }
  
  
  function init() {
    // Set up the vertical splitter bar
    $(".splitter .divider")
       .css({"left":($(window).innerWidth() / 2)+"px"})
       .draggable({ axis: "x", drag: function( event, ui ) { doLayout(); } });
    // layout when window changes
    $(window).resize(doLayout);
    // layout after everything else has been added
    setTimeout(doLayout, 1);
  }
  
  Espruino.Core.Layout = {
      init : init
  };
  
})();