Espruino Web IDE
======================

A Simple Web-Based VT100 Serial Terminal - designed for writing code on microcontrollers that use the Espruino JavaScript interpreter (http://www.espruino.com) - but useful for a bunch of other stuff too!

[![ScreenShot](https://raw.github.com/espruino/EspruinoWebIDE/master/extras/screenshot.png)](http://youtu.be/Fjju_QhzL-c)
[![ScreenShot](https://raw.github.com/espruino/EspruinoWebIDE/master/extras/screenshot2.png)](http://youtu.be/Fjju_QhzL-c)

This is a Chromium Web App that uses chome.serial to access your PC's serial port. You can download it from the Chrome Web Store: https://chrome.google.com/webstore/detail/espruino-serial-terminal/bleoifhkdalbjfbobjackfdifdneehpo

It implements basic VT100 terminal features (up/down/left/right/etc) - enough for you to write code using the Espruino. You can also use the right-hand pane to write JavaScript code on the PC, and can then click the 'transfer' icon to send that code directly down the Serial Port.

Currently, this isn't as good as it could be. So please, if you have some free time, help us improve this!

Installing From Chrome Web Store
----------------------------

* Install the [Chrome Web Browser](https://www.google.com/intl/en/chrome/browser/)
* [Go Here](https://chrome.google.com/webstore/detail/espruino-serial-terminal/bleoifhkdalbjfbobjackfdifdneehpo) to find the app in the Chrome Web Store
* Click 'Install'
* Click 'Launch App'

Installing
----------

* Install the [Chrome Web Browser](https://www.google.com/intl/en/chrome/browser/)
* Download the files in EspruinoSerialTerminal to a directory on your PC (either as a [ZIP File](https://github.com/espruino/EspruinoWebIDE/archive/master.zip), or using git)
* Click the menu icon in the top right
* Click 'Settings'
* Click 'Extensions' on the left
* Click 'Load Unpackaged Extension'
* Navigate to the EspruinoSerialTerminal Directory and click Ok
* Job Done. It'll now appear as an app, but you can start it easily right now by clicking the 'Launch' link on the extensions page, or whenever you open a new tab

Permissions
----------

This web app requires the following permissions:
* *Serial port access* : So that it can access the Espruino board via USB/Serial
* *Webcam access* : So that when you click the little person icon in the top-right of the terminal window, you can overlay the terminal on a live video feed

Using
-----

* Run the Web app
* If you've only just plugged your device in, press the refresh button
* In the Top Left, make sure the correct serial port is chosen (usually: Highest COM# number on Windows, tty.usbmodem/ttys000 on Mac, ttyUSB0/ttyACM0 on linux)
* Click the 'Play' (connect) button
* Click in the gray terminal window and start typing away!

Using (advanced)
--------------
* Click the button with left/right arrows to transfer the text (or graphics) in the right-hand pane to Espruino
* Click the button with a picture frame to switch between graphical and text views (the code will not auto-update)
* To copy on the left-hand side, click and drag over the text to copy
* To paste, press Ctrl + V

Features that would be good to implement
-----------------------------------
* Better auto-detection of the correct serial device
* Detection of serial disconnect (and auto reconnect)
* Figure out why Chrome on Linux randomly loses characters while writing to USB CDC devices
* Make everything prettier/easier to use
* Implement more of Espruino as Blockly Blocks
* Actually toggle WebCam on and off (currently it can only turn on)
* Blockly Blocks to turn red if they can't do certain things (for instance a pin that won't do analog)
* Some kind of arrangement so projects on the Espruino website could immediately be loaded
* Codeacademy-style online tutor that talks you through the first few steps of coding on Espruino
* Keep code on right in sync with graphical editor
* Being able to choose a filename for Save, so you don't have to change the name each time
* Storing the code and blockly blocks locally so they are remembered on startup

Nice but not required at all
-------------------------
* More complete VT100 terminal emulation
* Option to use a Baud rate other than the default 9600
* Use the Mozilla sound API to fake a serial port over the Audio Link for non-Chrome web browsers
