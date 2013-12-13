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
// in order to turn LED1 (the red light) on:
digitalWrite(LED1,1)

// This returned ```=undefined``` because digitalWrite does not return a value,
// but the red light should have lit up.
//
// You can turn the green and blue LEDs on using LED2 and LED3 respectively.
// 
// Now, turn the light off again:
digitalWrite(LED1,0)

// We can also read voltages in the real world. Right now we're only interested
// in whether something is on or off - a digital value, so we'll use digitalRead.
//
// Type in the following to read the value of the pushbutton:
digitalRead(BTN)

// This will return ```false```, which means 0 - that the button is not
// pressed.
//
// Now type the same command again, hold down the button furthest from the
// USB cable (don't press the reset button by mistake!), and press enter to
// execute it:
digitalRead(BTN)

// This returns ```true``` - meaning that the button is pressed
// 
// **Congratulations!** this concludes the first tutorial!
