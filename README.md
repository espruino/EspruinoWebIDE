Espruino Web IDE
======================

A VT100 Serial Terminal as a Chrome Web App (with both syntax highlighted and graphical editors) - designed for writing code on microcontrollers that use the [Espruino JavaScript interpreter](http://www.espruino.com).

[![ScreenShot](https://raw.github.com/espruino/EspruinoWebIDE/master/extras/screenshot.png)](http://youtu.be/Fjju_QhzL-c)
[![ScreenShot](https://raw.github.com/espruino/EspruinoWebIDE/master/extras/screenshot2.png)](http://youtu.be/Fjju_QhzL-c)

This is a Chrome Web App that uses [chome.serial](https://developer.chrome.com/apps/serial) to access your PC's serial port. You can download it from the Chrome Web Store: https://chrome.google.com/webstore/detail/espruino-serial-terminal/bleoifhkdalbjfbobjackfdifdneehpo

It implements basic VT100 terminal features (up/down/left/right/etc) - enough for you to write code using the Espruino. You can also use the right-hand pane to write JavaScript code on the PC, and can then click the 'transfer' icon to send that code directly down the Serial Port.

Installing From Chrome Web Store
----------------------------

* Install the [Chrome Web Browser](https://www.google.com/intl/en/chrome/browser/)
* [Go Here](https://chrome.google.com/webstore/detail/espruino-serial-terminal/bleoifhkdalbjfbobjackfdifdneehpo) to find the app in the Chrome Web Store
* Click 'Install'
* Click 'Launch App'

Installing from GitHub (Latest Version)
---------------------------------------

* Install the [Chrome Web Browser](https://www.google.com/intl/en/chrome/browser/)
* Download the files in EspruinoWebIDE to a directory on your PC (either as a [ZIP File](https://github.com/espruino/EspruinoWebIDE/archive/master.zip), or using git)
* Click the menu icon in the top right
* Click 'Settings'
* Click 'Extensions' on the left
* Click 'Load Unpackaged Extension'
* Navigate to the EspruinoWebIDE Directory and click Ok
* Job Done. It'll now appear as an app with the 'Unpacked' banner so you can tell it apart from the normal Web IDE. You can start it easily by clicking the 'Launch' link on the extensions page, or whenever you open a new tab.

Permissions
----------

This web app requires the following permissions:
* *Serial port access* : So that it can access the Espruino board via USB/Serial
* *Webcam access* : So that when you click the little person icon in the top-right of the terminal window, you can overlay the terminal on a live video feed
* *Filesystem/storage access* : For loading/saving your JvaScript files to your local disk

Using
-----

* Run the Web app
* Click the `Help` (?) icon, then the `Tour` button to get a guided tour.

Contributing
------------

Contributions are welcome - especially if they make the Web IDE easier to use for newcomers!

### Code Style

 * Please stick to a [K&R style](http://en.wikipedia.org/wiki/1_true_brace_style#K.26R_style) with no tabs and 2 spaces per indent
 * Filenames should start with a lowerCase letter, and different words should be capitalised, not split with underscores
 
### Code Outline

 * Core functionality goes in `js/core`, Plugins go in `js/plugins`. See `plugins/_examplePlugin.js` for an example layout
 * Plugins/core need to implement in init function, which is called when the document (and settings) have loaded.
 * Plugins can respond to specific events using `Espruino.addProcessor`. For instance you can use `Espruino.addProcessor("transformForEspruino", function (data,callback) { .. })` and can modify code before it is sent to Espruino.
 * Icons are added using `Espruino.Core.App.addIcon` and are generally added from JsvaScript file that performs the operation
 * Config is stored in `Espruino.Config.FOO` and is changed with `Espruino.Config.set("FOO", value)`. `Espruino.Core.Config.add` can be used to add an option to the Settings menu.  
 * Annoyingly, right now plugins still have to be loaded via a `<script>` tag in `main.html`    
