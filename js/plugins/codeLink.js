/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  A button that copies a URL containign the code to the clipboard 
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  var icon;
  var MAX_URL = 2000;
  
  function init() {
    Espruino.Core.Config.add("SHOW_CODE_LINK_ICON", {
      section : "General",
      name : "Show Copy URL Icon",
      description : "Show an icon that will create a URL containing the code from the Code Editor and will copy it to the clipboard. Great for sharing your code on Twitter/Websites/etc",
      type : "boolean",
      defaultValue : false, 
      onChange : function(newValue) { showIcon(newValue); }
    });    

    showIcon(Espruino.Config.SHOW_CODE_LINK_ICON);
  }

  function showIcon(show) {
    if (show) {
      icon = Espruino.Core.App.addIcon({ 
        id: "codeLink",
        icon: "star", 
        title : "Copy URL for this code to the clipboard", 
        order: 300, 
        area: { 
          name: "code", 
          position: "bottom"
        },
        click: copyCodeLink
      });    
    } else {
      if (icon!==undefined) icon.remove();
    }
  }
  
  function copyCodeLink() {
    var code = Espruino.Core.Code.getCurrentCode();
    var url = "http://www.espruino.com/webide?code="+encodeURIComponent(code);
    if (url.length > MAX_URL) {
      Espruino.Core.Notifications.error("Your code is too large for a URL (greater than "+MAX_URL+" characters)");
      return;
    }
    
    
    var copier = $('<textarea rows="1" cols="1"></textarea>').appendTo(document.body);
    copier.val(url).select();
    document.execCommand('copy');
    copier.remove();
    
    Espruino.Core.Notifications.info("URL Copied to clipboard");
  };
  
  Espruino.Plugins.CodeLink = {
    init : init,
  };
}());
