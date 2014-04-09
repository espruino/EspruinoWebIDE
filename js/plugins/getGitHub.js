/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Try and get any URLS that are from GitHub
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
    Espruino.addProcessor("getURL", getGitHub);      
  }
  
  function getGitHub(data, callback) {
    var match = undefined;
    if (!match) match = data.url.match(/^https?:\/\/github.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.*)$/);
    if (!match) match = data.url.match(/^https?:\/\/raw.githubusercontent.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.*)$/);
    if (match) {
      var git = {
          owner : match[1],
          repo : match[2],
          branch : match[3],
          path : match[4]
          };
      
      console.log("Found GitHub", JSON.stringify(git));
      var apiURL = "https://api.github.com/repos/"+git.owner+"/"+git.repo+"/contents/"+git.path+"?ref="+git.branch;
      $.get(apiURL, function(json) {
        if (json.type=="file" &&
            json.encoding=="base64") {
          // just load it...
          data.data = window.atob(json.content);
        } else {
          console.log("GET of "+apiURL+" returned JSON that wasn't a base64 encoded fine");          
        }
        callback(data);
      }, "json").fail(function() {
        console.log("GET of "+apiURL+" failed.");
        callback(data);
      });
    } else
      callback(data); // no match - continue as normal
  }

  Espruino.Plugins.GetGitHub = {
    init : init,
  };
}());