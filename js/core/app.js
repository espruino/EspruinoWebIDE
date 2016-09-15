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

  var nwwindow = undefined;
  var nwmaximised = false;
  if ("undefined" != typeof require) {
    if (process.versions.electron) {
      // Thanks electon :(
      if (require('electron').remote)
        nwwindow = require('electron').remote.getCurrentWindow(); // new
      else
        nwwindow = require('remote').getCurrentWindow(); // old
    } else
      nwwindow = require('nw.gui').Window.get();
  }

  var defaultIcon = {
    area: {
      name: "toolbar",
      position: "right"
    },
    menu: []
  };
  var initialised = false;
  
  /**
   * Initialize the window
   */
  function init()
  {
    Espruino.Core.App.addIcon({
      id:'minimize',
      icon: 'minus',
      title: 'Minimize Window',
      order: 1000,
      cssClass: 'title-bar__button--minimize',
      area: {
        name: "titlebar",
        position: "right"
      },
      click: function(){
        if (nwwindow) {
          nwwindow.minimize();
        } else {
          chrome.app.window.current().minimize();
        }
      }
    });

    Espruino.Core.App.addIcon({
      id:'maximize',
      icon: 'window',
      title: 'Maximize / Restore Window',
      order: 1001,
      cssClass: 'title-bar__button--maximize',
      area: {
        name: "titlebar",
        position: "right"
      },
      click: function(){
        if (nwwindow) {
          if (nwmaximised) {
            nwmaximised = false;
            nwwindow.unmaximize();
          } else {
            nwmaximised = true;
            nwwindow.maximize();
          }
        } else {
          if(chrome.app.window.current().isMaximized) {
            chrome.app.window.current().restore();
          } else {
            chrome.app.window.current().maximize();
          }
        }
      }
    });

    Espruino.Core.App.addIcon({
      id:'close',
      icon: 'cross',
      title: 'Close Window',
      order: 1002,
      cssClass: 'title-bar__button--close',
      area: {
        name: "titlebar",
        position: "right"
      },
      click: function(){
        if (nwwindow) {
          nwwindow.close();
        } else {
          chrome.app.window.current().close();
        }
      }
    });

    // Setup splitter
    $(".split-pane").splitster({
      orientation: "vertical", //TODO: Load from local storage,
      barWidth: 0, // Don't show the bar when vertical,
      draggable: ".editor--code > .sidebar"
    });

    // Setup orientation button
    var orientation = "vertical";
    var orientationBtn = Espruino.Core.App.addIcon({ 
      id: "orientation",
      icon: "split-" + orientation, 
      title : "Toggle Orientation", 
      order: -80, 
      divider: "right",
      area: { 
        name: "toolbar", 
        position: "right" 
      },
      click: function() {
        orientation = orientation == "vertical" ? "horizontal" : "vertical";
        $(".split-pane").splitster("orientation", orientation);
        $(".split-pane").splitster("barWidth", orientation == "vertical" ? 0 : 10);
        $(".split-pane").splitster("draggable", orientation == "vertical" ? ".editor--code > .sidebar" : false);
        orientationBtn.setIcon("split-" + orientation);
      }
    });

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
      sortIcons(".title-bar__buttons");
      sortIcons(".toolbar__buttons--left");
      sortIcons(".toolbar__buttons--right");
      sortIcons(".editor--terminal .sidebar__buttons--top");
      sortIcons(".editor--terminal .sidebar__buttons--bottom");
      sortIcons(".editor--code .sidebar__buttons--top");
      sortIcons(".editor--code .sidebar__buttons--bottom");
      return;
    }

    var mylist = typeof container === "string" ? $(container) : container;
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
    var api = $(".window--modal").data("api");
    if(api)
        api.close();
  }
  
  /**
   * Open a popup window
   */
  function openPopup(options) 
  {    
    // Declare API first, as we need to make sure the close button / overlay click
    // call the methods on the API object, rathert than a copy of the close method
    // so that the close method can be overridden with extra logic if needed.
    var api = {
      setContents : function(contents) 
      { 
        $(".window--modal > .window__viewport").html(contents);
      },
      close : function(){
        $(".window__overlay").remove();
      }
    }

    // Append the modal overlay
    $('<div class="window__overlay"><div class="window__overlay-inner"></div></div>').appendTo(".window--app > .window__viewport").click(function(){
      api.close();
    });
    var optid = (options.id) ? 'id="' + options.id + '"' : '';
    // Append the popup window
    $('<div class="window window--modal window--'+ options.position +'"' + optid + '>'+
          '<div class="window__title-bar title-bar">'+
            '<h5 class="title-bar__title">'+ options.title +'</h5>'+
            '<div class="title-bar__buttons"></div>'+
          '</div>'+
          '<div class="window__viewport">'+
            (options.padding ? '<div style="padding: 0px 10px 0px 10px;">':'')+
            options.contents +
            (options.padding ? '</div>':'')+             
          '</div>'+
        '</div>').appendTo(".window__overlay-inner").click(function(e){ e.stopPropagation(); })

    // Append close button
    $('<a class="icon-cross sml title-bar__button title-bar__button--close" title="Close"></a>').appendTo(".window--modal .title-bar__buttons").click(function(){
      api.close();
    });
    
    // Append 'next'/'ok' button if we registered a callback
    if (options.next) {
      $('<div class="guiders_buttons_container" style="padding: 10px 10px 10px 10px;bottom:10px;"><a class="guiders_button" href="#">Next</a></div>')
        .appendTo(".window--modal .window__viewport").click(options.next);
    }
    if (options.ok) {
      $('<div class="guiders_buttons_container" style="padding: 10px 10px 10px 10px;bottom:10px;"><a class="guiders_button" href="#">Ok</a></div>')
        .appendTo(".window--modal .window__viewport").click(options.ok);
    }

    // Apply dimensions
    if(options.width)
    {
      $(".window--modal").width(options.width);
    }

    if(options.height)
    {
      $(".window--modal").height(options.height);
    }
    
    $(".window--modal").data("api", api);

    return api;
  }

  /**
   * Add an icon to the window in the specified area
   * 
   * options = {
   *   id    : a unique ID for this icon
   *   icon  : the icon type to use
   *   area  : { name : titlebar | toolbar | terminal | code,  position : left | middle | right | top | bottom }
   *   name  : icon name - corresponds to icons.css
   *   title : nice title for tooltips
   *   order : integer specifying the order. After icons have been added they'll be sorted so this is ascending
   */
  function addIcon(options) 
  {
    options = $.extend({}, defaultIcon, options);

    var selector = "";
    var iconSize = 'lrg';
    var additionalClasses = '';
    switch(options.area.name){
      case "titlebar":
        selector = ".window--app > .title-bar > .title-bar__buttons";
        iconSize = 'sml';
        additionalClasses = 'title-bar__button';
        break;
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

    if(options.cssClass)
      additionalClasses += ' '+ options.cssClass;

    var container = $(selector);
    if(container.length == 0)
    {
      console.warn("App.addIcon unknown area: "+ selector);
      return;
    }
    
    var order = 0;
    if (options.order !== undefined) 
      order = options.order;

    var elementClass = 'icon-'+ options.icon;
    
    // remove old icon if there was one
    var c = container.children("."+elementClass);
    c.remove();
    
    // add the element
    var element = $('<a id="icon-'+ options.id +'" class="'+ elementClass +' '+ iconSize +' '+ additionalClasses +'" title="'+ options.title +'" data-icon-order="'+ order +'"></a>').appendTo(container);
    
    if(options.divider)
      element.addClass("icon--divide-"+ options.divider);

    if(options.click)
      element.on("click", options.click);
    
    if (initialised)
      sortIcons(selector);

    var api = {
      setIcon : function(icon) {
        element.removeClass(elementClass);
        elementClass = 'icon-'+ icon;
        element.addClass(elementClass);
      },
      remove : function() {
        element.off(); // Remove all event handlers
        element.remove();
      },
      addMenuItem: function(options)
      {
        var menuEl = element.find(".menu");
        if(menuEl.length == 0)
           menuEl = $('<div class="menu"></div>').appendTo(element)

        var order = 0;
        if (options.order !== undefined) 
          order = options.order;

        var menuItemEl = $('<a id="icon-'+ options.id +'" title="'+ options.title +'" data-icon-order="'+ order +'"><i class="icon-'+ options.icon +' sml"></i> '+ options.title +'</a>').appendTo(menuEl);
        if(options.click)
          menuItemEl.click(function(e){
            e.stopPropagation();
            options.click(e);
          });

        sortIcons(menuEl);
      }
    };

    if(options.menu && options.menu.length > 0)
    {
      $.each(options.menu, function(idx, itm){
        api.addMenuItem(itm);
      });
    }

    element.data("api", api);

    return api;
  }

  function findIcon(id)
  {
    return $("#icon-"+ id).data("api");
  }

  Espruino.Core.App = {
      init : init,
      openPopup: openPopup,
      closePopup: closePopup,
      addIcon: addIcon,
      findIcon: findIcon
  };
  
})();
