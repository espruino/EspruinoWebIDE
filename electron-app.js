#!/usr/bin/env node
/* Initialisation code for running the Web IDE as a 'native' app under Electron */
'use strict';

var DEV = false; // are we developing? Adds frame and dev tools

// ----------------------------------------------------
function help() {
  console.log("Espruino Web IDE");
  console.log("   USAGE:");
  console.log("      --help        This help screen");
  console.log("      --dev         Enable developer tools");
  process.exit(0);
}
// ---------------------------------------------------- arg parsing
for (var i=2;i<process.argv.length;i++) {
  var arg = process.argv[i];
  if (arg=="--dev") {
    DEV = true;
  } else {
    if (arg!="--help") console.log("Unknown argument "+arg);
    help();
  }
}
// ----------------------------------------------------

try {
  global.electron = require('electron');
} catch (e) {
  console.warn("require('electron') doesn't work! Try running 'electron-loader.js' instead.");
  return;
}
var app = electron.app;

if (!app) {
  console.warn("'electron.app' doesn't exist! Try 'npm remove electron' and be sure to run 'electron-loader.js' instead.");
  return;
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;


// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new electron.BrowserWindow({
    width: DEV ? 1500 : 1024,
    height: DEV ? 900 : 800,
    frame: DEV,
    'accept-first-mouse': true,
    'title-bar-style': 'hidden'
  });

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/main.html');

  // Open the DevTools.
  if (DEV) mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
