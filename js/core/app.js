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
    } else {
      nwwindow = require('nw.gui').Window.get();
      /* When new windows are loaded in nw.js they're loaded like the current
      frame - with no navigation or title bar. Stop this behaviour and load
      the system web browser instead (fix #187) */
      nwwindow.on('new-win-policy', function (frame, url, policy) {
        //policy.setNewWindowManifest({toolbar:true,frame:true}); // looks grim
        policy.ignore();
        require('nw.gui').Shell.openExternal( url );
      });
    }
  }

  var defaultIcon = {
    area: {
      name: "toolbar",
      position: "right"
    },
    menu: []
  };
  var initialised = false;
  var _idcounter = 1;

  /**
   * Initialize the window
   */
  function init() {
    // If we have no native title bar, make sure we remove it from the app
    if (Espruino.Core.Utils.hasNativeTitleBar()) {
      document.getElementsByClassName("title-bar")[0].remove();
      document.getElementsByClassName("window")[0].classList.remove("window--app");
    }
    // check again, just in case it's removed from the HTML
    if (document.getElementsByClassName("title-bar").length) {
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
            if(chrome.app.window.current().isMaximized()) {
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
    }

    // Setup splitter
    if (document.getElementsByClassName("split-pane").length) {
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
    }

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
    var win = document.querySelector(".window--modal");
    if (win) {
      var api = win.data_api;
      if(api) api.close();
    }
  }

/**
  * Open a popup window
  *
  * options = {
  *   id    : a unique ID for this window
  *   position  : "center" // middle of screen, small
                  "stretch" // across the screen
                  "auto"    // full height, auto width
  *   padding  : bool - add padding or not?
  *   width / height : set size in pixels
  *   title : title text
  *   contents : html contents
  *   ok : callback - add 'ok' button and call callback when clicked
  *   cancel : callback - add 'cancel' button and...
  *   next : callback - add 'next' button and...
  *   yes : callback - add 'yes' button and...
  *   no : callback - add 'no' button and...
  *
  *
  * returns : {
  *  setContents, // set window contents
  *  close, // close this window
  *  window  // the window's dom element
  * }
  */
  function openPopup(options)
  {
    if (!options.id) options.id = "_popup"+_idcounter++;
    // Declare API first, as we need to make sure the close button / overlay click
    // call the methods on the API object, rathert than a copy of the close method
    // so that the close method can be overridden with extra logic if needed.
    var api = {
      setContents : function(contents) {
        winModal.querySelector(".window__viewport").innerHTML = contents;
      },
      close : function() {
        winOverlay.remove();
      }
    }


    // Append the modal overlay
    var winOverlay = Espruino.Core.Utils.domElement('<div class="window__overlay"><div class="window__overlay-inner"></div></div>');
    document.querySelector(".window > .window__viewport").append(winOverlay);
    winOverlay.addEventListener("click", function(w) {
      api.close()
    });
    // Append the popup window
    var winModal = Espruino.Core.Utils.domElement('<div class="window window--modal window--'+ options.position +'" id="' + options.id + '">'+
          '<div class="window__title-bar title-bar">'+
            '<h5 class="title-bar__title">'+ options.title +'</h5>'+
            '<div class="title-bar__buttons"></div>'+
          '</div>'+
          '<div class="window__viewport">'+
            (options.padding ? '<div style="padding: 0px 10px 0px 10px;">':'')+
            options.contents +
            (options.padding ? '</div>':'')+
          '</div>'+
        '</div>');
    winModal.addEventListener("click", function(e) {
      e.stopPropagation();
    });
    winOverlay.querySelector(".window__overlay-inner").append(winModal);
    winOverlay.addEventListener("click", function(e) {
      e.stopPropagation();
    });

    // Append close button
    var winClose = Espruino.Core.Utils.domElement('<a class="icon-cross sml title-bar__button title-bar__button--close" title="Close"></a>');
    winClose.addEventListener("click", function(e) {
      api.close();
    });
    winModal.querySelector(".title-bar__buttons").append(winClose);

    // Append 'next'/'ok' button if we registered a callback
    var buttoncontainer;
    if (options.next || options.ok || options.cancel || options.yes || options.no) {
      buttoncontainer = Espruino.Core.Utils.domElement(
        '<div class="guiders_buttons_container" style="padding: 10px 10px 10px 10px;bottom:10px;">');
      winModal.querySelector(".window__viewport").append(buttoncontainer);
    }
    if (options.next) {
      var btn = Espruino.Core.Utils.domElement('<a class="guiders_button" href="#">Next</a>');
      btn.addEventListener("click", options.next);
      buttoncontainer.append(btn);
    }
    if (options.cancel) {
      var btn = Espruino.Core.Utils.domElement('<a class="guiders_button" href="#">Cancel</a>');
      btn.addEventListener("click", options.cancel);
      buttoncontainer.append(btn);
    }
    if (options.ok) {
      var btn = Espruino.Core.Utils.domElement('<a class="guiders_button" href="#">Ok</a>');
      btn.addEventListener("click", options.ok);
      buttoncontainer.append(btn);
    }
    if (options.no) {
      var btn = Espruino.Core.Utils.domElement('<a class="guiders_button" href="#">No</a>');
      btn.addEventListener("click", options.no);
      buttoncontainer.append(btn);
    }
    if (options.yes) {
      var btn = Espruino.Core.Utils.domElement('<a class="guiders_button" href="#">Yes</a>');
      btn.addEventListener("click", options.yes);
      buttoncontainer.append(btn);
    }

    // Apply dimensions
    if(options.width)
      winModal.width(options.width);

    if(options.height)
      winModal.height(options.height);

    winModal.data_api = api;
    api.window = winModal;

    return api;
  }

  /**
   * Add an icon to the window in the specified area
   *
   * options = {
   *   id    : a unique ID for this icon
   *   icon  : the icon type to use (corresponds to icons.css)
   *   area  : {
   *             name : titlebar | toolbar | terminal | code,
   *             position : left | middle | right | top | bottom
   *           }
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

  /**
   * Add an icon to the window somewhere that'll alert the user
   *
   * options = {
   *   id    : a unique ID for this icon
   *   icon  : the icon type to use
   *   area  : { name : titlebar | toolbar | terminal | code,  position : left | middle | right | top | bottom }
   *   name  : icon name - corresponds to icons.css
   *   title : nice title for tooltips
   */
  function addAlertIcon(options)
  {
    options.icon = 'alert';
    options.order = 999;
    options.cssClass = 'icon-alert';
    if (Espruino.Core.Utils.hasNativeTitleBar()) {
      // Then we don't have a toolbar :(
      options.area = {
        name: "toolbar",
        position: "right"
      };
    } else {
      options.area = {
        name: "titlebar",
        position: "right"
      };
    }
    return addIcon(options);
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
      addAlertIcon : addAlertIcon,
      findIcon: findIcon
  };

})();
