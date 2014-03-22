/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Main App Container
 ------------------------------------------------------------------
**/
"use strict";

(function() {

  var initialised = false;
  
  /**
   * Initialize the window
   */
  function init()
  {
    // Hookup window buttons
    $(".window--app .title-bar__button--minimize").on("click", function(e){
      e.preventDefault();
      chrome.app.window.current().minimize();
    });
    $(".window--app .title-bar__button--maximize").on("click", function(e){
      e.preventDefault();
      if(chrome.app.window.current().isMaximized()) {
        chrome.app.window.current().restore();
      } else {
        chrome.app.window.current().maximize();
      }
    });
    $(".window--app .title-bar__button--close").on("click", function(e){
      e.preventDefault();
      chrome.app.window.current().close();
    });

    // Setup splitter
    $(".split-pane").splitster({
      orientation: "vertical" //TODO: Load from local storage
    });

    // Setup orientation button
    var orientation = "vertical";
    var orientationBtn = Espruino.Core.App.addIcon({ 
      name: "split-" + orientation, 
      title : "Toggle Orientation", 
      order: -90, 
      area: { 
        name: "toolbar", 
        position: "right" 
      } 
    }, function() {
      orientation = orientation == "vertical" ? "horizontal" : "vertical";
      $(".split-pane").splitster("orientation", orientation);
      orientationBtn.setIcon("split-" + orientation);
    });

    //Espruino.Core.Notifications.error("Something good");

    // layout after everything else has been added
    Espruino.addProcessor("initialised", function(data,callback) {
      sortIcons();
      callback(data);
      initialised = true;
    });
  }

  // sort all icons in a container according to their icon-order field (see addIcon)
  function sortIcons(container) 
  {
    if (container === undefined) {
      sortIcons(".toolbar__buttons--left");
      sortIcons(".toolbar__buttons--right");
      sortIcons(".editor--terminal .sidebar__buttons--top");
      sortIcons(".editor--terminal .sidebar__buttons--bottom");
      sortIcons(".editor--code .sidebar__buttons--top");
      sortIcons(".editor--code .sidebar__buttons--bottom");
      return;
    }

    var mylist = $(container);
    var listitems = mylist.children(/*'a'*/).get();
    listitems.sort(function(a, b) {
       return parseFloat($(a).data("icon-order")) - parseFloat($(b).data("icon-order"));
    });
    $.each(listitems, function(idx, itm) { mylist.append(itm); });
  }

  /**
   * Close a popup window if one was shown
   */
  function closePopup() 
  {
    $(".window__overlay").remove();
  }
  
  /**
   * Open a popup window
   */
  function openPopup(options) 
  {    
    // Append the modal overlay
    $('<div class="window__overlay"><div class="window__overlay-inner"></div></div>').appendTo(".window--app > .window__viewport").click(closePopup);

    // Append the popup window
    $('<div class="window window--modal window--'+ options.position +'">'+
          '<div class="window__title-bar title-bar">'+
            '<h5 class="title-bar__title">'+ options.title +'</h5>'+
            '<div class="title-bar__buttons"></div>'+
          '</div>'+
          '<div class="window__viewport">'+
            options.contents +
          '</div>'+
        '</div>').appendTo(".window__overlay-inner").click(function(e){ e.stopPropagation(); })

    // Append close button
    $('<a class="icon-cross sml title-bar__button title-bar__button--close" title="Close"></a>').appendTo(".window--modal .title-bar__buttons").click(closePopup);

    // Apply dimensions
    if(options.width)
    {
      $(".window--modal").width(options.width);
    }

    if(options.height)
    {
      $(".window--modal").height(options.height);
    }
    
    return {
      setContents : function(contents) 
      { 
        $(".window--modal > .window__viewport").html(contents);
      },
      close : closePopup,
    };
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
  function addIcon(options, callback) 
  {
    var selector = "";
    switch(options.area.name){
      case "toolbar":
        selector = ".toolbar__buttons--" + options.area.position
        break;
      case "terminal":
        selector = ".editor--terminal .sidebar__buttons--" + options.area.position
        break;
      case "code":
        selector = ".editor--code .sidebar__buttons--" + options.area.position
        break;
    }

    var container = $(selector);
    if(container.length == 0)
    {
      console.warn("App.addIcon unknown area: "+ selector);
      return;
    }

    var order = 0;
    if (options.order !== undefined) order = options.order;

    var elementClass = 'icon-'+ options.name;    
    var element = $('<a class="'+ elementClass +' lrg" title="'+ options.title +'" data-icon-order="'+ order +'"></a>').appendTo(container);
    element.click(callback);
    
    if (initialised)
      sortIcons(selector);

    return {
      setIcon : function(icon) {
        element.removeClass(elementClass);
        elementClass = 'icon-'+ icon;
        element.addClass(elementClass);
      },
      remove : function() {
        element.remove();
      }
    };
  }

  Espruino.Core.App = {
      init : init,
      openPopup: openPopup,
      closePopup: closePopup,
      addIcon: addIcon
  };
  
})();
