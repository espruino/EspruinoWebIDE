/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Awesome Tern Autocomplete code
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
    function getURL(url, c) {
      var xhr = new XMLHttpRequest();
      xhr.open("get", url, true);
      xhr.send();
      xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) return;
        if (xhr.status < 400) return c(null, xhr.responseText);
        var e = new Error(xhr.responseText || "No response");
        e.status = xhr.status;
        c(e);
      };
    }
  
    var server;
    var espruinoJSON;
    getURL(/*"http://ternjs.net/defs/ecma5.json"*/"/data/espruino.json", function(err, code) {
      var codeMirror = Espruino.Core.EditorJavaScript.getCodeMirror();
      if (err) throw new Error("Request for ecma5.json: " + err);
      espruinoJSON = code;
      server = new CodeMirror.TernServer({defs: [JSON.parse(espruinoJSON)]});
      codeMirror.setOption("extraKeys", {
        "Ctrl-Space": function(cm) { server.smartComplete(cm); }, 
        "Ctrl-I": function(cm) { server.showType(cm); },
        "Alt-.": function(cm) { server.jumpToDef(cm); },
        "Alt-,": function(cm) { server.jumpBack(cm); },
        "Ctrl-Q": function(cm) { server.rename(cm); },
        "Ctrl-.": function(cm) { server.selectName(cm); }
      })
      codeMirror.on("cursorActivity", function(cm) { server.updateArgHints(cm); });
    });
    
    /* When we connect to a board and we load its description,
     go through an add all the pins as variables so Tern cal autocomplete */ 
    Espruino.addProcessor("boardJSONLoaded", function (data, callback) {
      if (espruinoJSON !== undefined && "pins" in data) {
        var defs = JSON.parse(espruinoJSON);
        data.pins.forEach(function(pin) {
          var functions = [];
          for (var fn in pin.simplefunctions) {
            if (["PWM","USART","SPI","I2C","DEVICE"].indexOf(fn)>=0)
              functions = functions.concat(pin.simplefunctions[fn]);              
            else
              functions.push(fn);
          }
          defs[pin["name"]] = {
            "!type": "+Pin",
            "!doc": functions.join(", "),
            "!url": "http://www.espruino.com/Reference"+data["BOARD"]+"#"+pin["name"],
          };
        });
        
        // reload tern server with new defs
        server = new CodeMirror.TernServer({defs: [defs]});
      }
      
      callback(data);
    });
  }
  
  Espruino.Plugins.Tern = {
    init : init,
  };
}());