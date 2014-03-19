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
    var h = $(window).innerHeight();
    var innerH = h - $("#toolbar").outerHeight();
    $(".splitter").height(innerH);
    $(".splitter").children().height(innerH);

    $("#toolbar .left").css({"left":"0px", "width":leftWidth+"px" });
    $(".splitter .left").css({"left":"0px", "width":leftWidth+"px" });    
    $("#terminal").css({ "width":leftWidth-4, "height":innerH-4/* because of 2px border */ });
    $("#videotag").css({ "width":leftWidth, "height":innerH });

    $("#toolbar .middle").css({"left":(splitx+splitw-60)+"px", "width":rightWidth+"px"});
    $(".splitter .right").css({"left":(splitx+splitw)+"px" , "width":rightWidth+"px"});    
    $("#divcode").css({ "width":rightWidth, "height":innerH });     
    $("#divblockly").css({ "width":rightWidth, "height":innerH });  
    
    // if there's a popup, ensure it keeps filling the screen
    $(".popup_overlay").css({ "width":w, "height":h });  
    var POPUP_MARGIN = 48;
    $(".popup.stretch").css({ "left":POPUP_MARGIN, "top":POPUP_MARGIN, "width":w-POPUP_MARGIN*2, "height":h-POPUP_MARGIN*2 });
  }
  
  // sort all icons in a container according to their icon-order field (see addIcon)
  function sortIcons(container) {
    var mylist = $(container);
    var listitems = mylist.children(/*'a'*/).get();
    listitems.sort(function(a, b) {
       return parseFloat($(a).attr("icon-order")) - 
              parseFloat($(b).attr("icon-order"));
    });
    $.each(listitems, function(idx, itm) { mylist.append(itm); });
  }
  
  
  function init() {
    // Buttons 
    var viewButton = Espruino.Core.Layout.addIcon({ name: "code", title : "Switch between Code and Graphical Designer", order: 0, area: "middle" }, function() {
      if (isInBlockly()) {
        $("#divblockly").hide();
        $("#divcode").show();
        viewButton.setIcon("code");
      } else {
        $("#divcode").hide();
        $("#divblockly").show();
        viewButton.setIcon("block");
      }
    });
    
    // Set up the vertical splitter bar
    $(".splitter .divider")
       .css({"left":($(window).innerWidth() / 2)+"px"})
       .draggable({ 
         axis: "x", 
         drag: function( ) { doLayout(); },
         stop: function( ) { doLayout(); },
         iframeFix: true
       });
    // layout when window changes
    $(window).resize(doLayout);
    // layout after everything else has been added
    Espruino.addProcessor("initialised", function(data,callback) {
      sortIcons(".splitter .divider");
      sortIcons(".toolbar .left");
      sortIcons(".toolbar .middle");
      sortIcons(".toolbar .right");
      doLayout();
    });
  }
  
  /**
   * Add an icon to the window in the specified area
   * 
   * options = {
   *   area : splitter | left | middle | right
   *   name : icon name - corresponds to icons.css
   *   title : nice title for tooltips
   *   order : integer specifying the order. After icons have been added they'll be sorted so this is ascending
   */
  function addIcon(options, callback) {
    var area = ".toolbar .left";
    if (options.area=="splitter") area = ".splitter .divider";
    else if (options.area=="left") area = ".toolbar .left";
    else if (options.area=="middle") area = ".toolbar .middle";
    else if (options.area=="right") area = ".toolbar .right";
    else console.warn("Layout.addIcon unknown area");
    var order = 0;
    if (options.order!==undefined) order=options.order;
    var elementClass = 'icon-'+options.name;    
    var element = $('<a class="'+elementClass+' lrg" title="'+options.title+'" icon-order="'+order+'"></a>').appendTo(area);
    element.click(callback);
    
    return {
      setIcon : function(icon) {
        element.removeClass(elementClass);
        elementClass = 'icon-'+icon;
        element.addClass(elementClass);
      }
    };
  }
  
  /**
   * Add a popup window
   */
  function addPopup(contents, options) {
    $('<div class="popup_overlay"></div>').appendTo(document.body).click(function() {
      $(".popup").remove();
      $(".popup_overlay").remove();
    });
    $('<div class="popup stretch"><div class="popup_title">'+options.title+'</div>'+contents+'</div>').appendTo(document.body);
    doLayout();
  }
  
  
  function isInBlockly() { // TODO: we should really enumerate views - we might want another view?
    return $("#divblockly").is(":visible");
  };
  
  Espruino.Core.Layout = {
      init : init,
      
      addIcon : addIcon,
      addPopup : addPopup,
      
      isInBlockly : isInBlockly
  };
  
})();