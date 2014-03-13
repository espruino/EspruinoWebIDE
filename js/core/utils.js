/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Utilities
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
    
  }
  
  function isWindows() {
    return navigator.userAgent.indexOf("Windows")>=0;
  }
  
  function getChromeVersion(){
    return parseInt(window.navigator.appVersion.match(/Chrome\/(.*?) /)[1].split(".")[0]);
  }
  
  function escapeHTML(text) {
    var chr = { '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;', ' ': '&nbsp;' };
    return text.replace(/[\"&<> ]/g, function (a) { return chr[a]; });    
  }
  
  function getSubString(str, from, len) {
    if (len == undefined) {
      return str.substr(from, len);
    } else {
      var s = str.substr(from, len);
      while (s.length < len) s+=" ";
      return s;
    }
  };  
  
  Espruino.Core.Utils = {
      init : init,
      isWindows : isWindows,   
      getChromeVersion : getChromeVersion,
      escapeHTML : escapeHTML,
      getSubString : getSubString,
  };
}());