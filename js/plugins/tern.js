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
    getURL(/*"http://ternjs.net/defs/ecma5.json"*/"data/espruino.json", function(err, code) {
      var codeMirror = Espruino.Core.EditorJavaScript.getCodeMirror();
      if (err) throw new Error("Request for ecma5.json failed: " + err);
      espruinoJSON = code;
      server = new CodeMirror.TernServer({defs: [JSON.parse(espruinoJSON)]});

      function hintHandler(cm, c) {
        /* Bodges Tern's handler so it can display HTML */
        return server.getHint(cm,function(data) {
          if (data.list)
            for (var i=0;i<data.list.length;i++) {
              var l = data.list[i];
              if (!l.data || !l.data.doc) continue;
              var div = document.createElement('div');
              div.innerHTML = l.data.doc;
              l.data.doc = div;
            }
          c(data);
        });
      }
      hintHandler.async = true;

      var k = codeMirror.getOption("extraKeys");
      var nk = {
        "Ctrl-Space": function(cm) { codeMirror.showHint({hint: hintHandler}); }, // server.complete(cm);
        "Ctrl-I": function(cm) { server.showType(cm); },
        "Alt-.": function(cm) { server.jumpToDef(cm); },
        "Alt-,": function(cm) { server.jumpBack(cm); },
        "Ctrl-Q": function(cm) { server.rename(cm); },
        "Ctrl-.": function(cm) { server.selectName(cm); }
      };
      for (var i in nk)
        k[i] = nk[i];
      codeMirror.setOption("extraKeys", k);
      codeMirror.on("cursorActivity", function(cm) { server.updateArgHints(cm); });
    });

    /* Ideally espruino.json has:

      "require": {
         "!type": "fn(moduleName: ?) -> !custom:require_handler",

      .. and then this handler gets called and sets the correct return type
      when someone uses `require()`.

      The type is in espruino.json at the root level at the moment, so
      require("http") => "http" object. But what I'm doing below isn't working :(
     */
    /*var infer = tern;
    infer.registerFunction("require_handler", function(self, args, argNodes) {
      if (argNodes.length!=1 || argNodes[0].type!="Literal") return;
      var moduleName = argNodes[0].value;
      var moduleType = new infer.Obj(null, moduleName); // broken
      self.propagate(moduleType);
      return infer.ANull;
    });*/

    /* When we connect to a board and we load its description,
     go through an add all the pins as variables so Tern cal autocomplete */
    Espruino.addProcessor("boardJSONLoaded", function (data, callback) {
      if (espruinoJSON !== undefined) {
        var defs;
        try {
          defs = JSON.parse(espruinoJSON);
        } catch (e) {
          console.log("ERROR: boardJSONLoaded, ", e.toString());
          callback(data);
          return;
        }
        if ("pins" in data) {
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
        }
        if ("devices" in data) {
          var devices = ["LED1","LED2","LED3","LED4","LED5","LED6","LED7","LED8","BTN","BTN1","BTN2","BTN3","BTN4"];
          devices.forEach(function(device) {
            if (device in data.devices) {
              defs[device] = {
                  "!type": "+Pin",
                  "!doc": "A Pin"
                };
            }
          });
        }

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
