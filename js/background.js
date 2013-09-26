chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('main.html', {id:"espruino_mainwindow", width: 1024, height: 600, singleton: true});
});
