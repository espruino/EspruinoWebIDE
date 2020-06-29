// **Welcome to Espruino!**
//
// Espruino lets you write commands interactively using a shell (It's also called a REPL).
//
// When you press 'Enter' after typing a command, it is executed and the result is returned.
//
// Let's try it now. We'll do a simple sum. Just type the following:
1+2

// This returned the result after the equals sign: ```=3```
//
// But we can also write commands that don't return anything. Type the following
// in order to turn LED1 (the <!PIXLJS>red light</!PIXLJS><PIXLJS>backlight</PIXLJS>) on:
digitalWrite(LED1,1)

// This returned ```=undefined``` because digitalWrite does not return a value,
// but the <!PIXLJS>red light</!PIXLJS><PIXLJS>backlight</PIXLJS>) should have lit up.
// <!PIXLJS>
// You can turn the green and blue LEDs on using LED2 and LED3 respectively.</!PIXLJS>
//
// Now, turn the light off again by typing the same command with a ```0```
// instead of a ```1```. Note that you can press the up arrow to go back to
// the previous line you entered, then can move the cursor with the left
// and right arrows. When you're done use the right arrow or **End** key
// to go to the end of the line before hitting enter.
//
// If you do something wrong it doesn't matter - just press Ctrl+C to
// clear the current line and start again. You're after:
digitalWrite(LED1,0)

// We can also read voltages in the real world. Right now we're only interested
// in whether something is on or off - a digital value, so we'll use digitalRead.
//
// Type in the following to read the value of the pushbutton:
digitalRead(BTN)

// This will return ```0``` - which means that the button is not
// pressed.
//
// Now press up arrow to choose the same command again, hold down the button
// furthest from the USB cable (don't press the reset button by mistake!),
// and press enter to execute it:
digitalRead(BTN)

// This returns ```1``` - meaning that the button is pressed
//
// Now we're going to flash the light on and off while the button
// is pressed. For the first step, let's make the light flash.
//
// For this, we will create a function that can be called every time
// we want the light to flash. As you type what is below, note that
// when you press 'enter' after the first line, the line doesn't execute
// like it did before. This is because you have an opening bracket
// but no matching close bracket.
//
// Type in the following - this create a function that will turn LED1 on
// and then off 200ms = 1/5th of a second later
function flash() {
  digitalWrite(LED1,1);
  setTimeout(function() {
    digitalWrite(LED1,0);
  }, 200);
}

// This has now displayed ```=function() { ... }``` which shows
// that your function has been added, but it hasn't been executed yet.
//
// To do that, type:
flash()

// This will flash LED1. You can now choose whether you want to
// flash the light, depending on the button.
//
// Type the following - when you press enter, LED1 will flash
// **if** the button is pressed.
if (digitalRead(BTN)) flash();

// Now, we just need to run this command more often - maybe every 500ms
// (twice a second)
setInterval(function() {
  if (digitalRead(BTN)) flash();
}, 500);

// Now, if you hold down the button, LED1 will flash - but
// if you release it, it will stop.
//
// **Congratulations!** this concludes the first tutorial!
