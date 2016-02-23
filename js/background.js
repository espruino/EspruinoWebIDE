chrome.app.runtime.onLaunched.addListener(function(launchData) {
  chrome.app.window.create('main.html', {
    id:"espruino_mainwindow", 
    width: 1024, 
    height: 600, 
    singleton: true,
    frame: 'none'
  }, function(win) {
    // ---------------------------------------------------------- SAVE ON EXIT
    win.onClosed.addListener(function() {
      // Copy code from local storage into sync storage
      // Code was put into local storage by editorJavaScript
      chrome.storage.local.get("CODE_JS", function (ldata) {    
        chrome.storage.local.remove("CODE_JS");
        if (!("CODE_JS" in ldata)) return;
        chrome.storage.sync.get( "CONFIGS", function (ddata) {          
          var data = ddata["CONFIGS"];
          data["CODE"] = ldata["CODE_JS"];
          chrome.storage.sync.set({ CONFIGS : data });   
        });
      });
    });
    // ---------------------------------------------------------- CLOSE SERIAL ON EXIT
    win.onClosed.addListener(function() {
      // Background script keeps running even after window close
      // for a few seconds. So serial connection keeped open and
      // we can't connect to the board again after quick IDE restart
      chrome.serial.getConnections(function(connections) {
        connections.forEach(function(c) {
          chrome.serial.disconnect(c.connectionId, function() {});
        });
      });
    });

    // ---------------------------------------------------------- URL LAUNCH
    if (launchData.id) {
      // We are called to handle a URL that matches one of our url_handlers.
      if (launchData.id === 'espruino_code') {
       if (win.contentWindow.Espruino!==undefined && win.contentWindow.Espruino.initialised==true) {
          win.contentWindow.Espruino.Plugins.URLHandler.handle(launchData.url);
        } else {
          // timeout required for first launch for some reason
          win.contentWindow.setTimeout(function() {            
              win.contentWindow.Espruino.Plugins.URLHandler.handle(launchData.url);
          }, 2000);
        }
      } else {
        console.error("Unexpected URL handler ID: " + launchData.id);
      }
    }
    
  });
  
  
 
});
