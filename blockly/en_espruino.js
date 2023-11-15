if (window.location.href.indexOf("lang=en")>=0 ||
    window.location.href.indexOf("lang=")==-1) {

  Blockly.Msg.ESPRUINO_WAIT = 'wait';
  Blockly.Msg.ESPRUINO_SECONDS = 'seconds';
  Blockly.Msg.ESPRUINO_WAIT_TOOLTIP = 'Delay for a certain amount of time';
  Blockly.Msg.ESPRUINO_AFTER = 'after';
  Blockly.Msg.ESPRUINO_AFTER_TOOLTIP = 'Waits for a certain period before running code';

  Blockly.Msg.ESPRUINO_EVERY_TOOLTIP = 'Runs code repeatedly, every so many seconds';
  Blockly.Msg.ESPRUINO_EVERY = 'every';

  Blockly.Msg.ESPRUINO_MORE = 'More';
  Blockly.Msg.ESPRUINO_BACK = 'Back';
  Blockly.Msg.ESPRUINO_PIN_NAME = 'The Name of a Pin';

  Blockly.Msg.ESPRUINO_WATCH = 'watch';
  Blockly.Msg.ESPRUINO_WATCH_TOOLTIP = 'Runs code when an input changes';
  Blockly.Msg.ESPRUINO_TIME = 'Time';
  Blockly.Msg.ESPRUINO_TIME_TOOLTIP = 'Read the current time in seconds';
  Blockly.Msg.ESPRUINO_DIGITALWRITE = 'digitalWrite Pin';
  Blockly.Msg.ESPRUINO_VALUE = 'Value';
  Blockly.Msg.ESPRUINO_DIGITALWRITE_TOOLTIP = 'Writes a Digital Value to a Pin';
  Blockly.Msg.ESPRUINO_DIGITALPULSE = 'digitalPulse Pin';
  Blockly.Msg.ESPRUINO_MILLISECONDS = 'Milliseconds';
  Blockly.Msg.ESPRUINO_DIGITALPULSE_TOOLTIP = 'Pulses a pin for the given number of milliseconds';
  Blockly.Msg.ESPRUINO_DIGITALREAD = 'digitalRead Pin';
  Blockly.Msg.ESPRUINO_DIGITALREAD_TOOLTIP = 'Read a Digital Value from a Pin';
  Blockly.Msg.ESPRUINO_ANALOGWRITE = 'analogWrite Pin';
  Blockly.Msg.ESPRUINO_ANALOGWRITE_TOOLTIP = 'Writes an Analog Value to a Pin';
  Blockly.Msg.ESPRUINO_ANALOGREAD = 'analogRead Pin';
  Blockly.Msg.ESPRUINO_ANALOGREAD_TOOLTIP = 'Read an Analog Value from a Pin';
  Blockly.Msg.ESPRUINO_PINMODE = 'pinMode Pin';
  Blockly.Msg.ESPRUINO_PINMODE_TOOLTIP = 'Sets the mode of the pin (if not used, pin mode is set automatically)';
  Blockly.Msg.ESPRUINO_JS_TOOLTIP = 'Executes the given JavaScript code';
  Blockly.Msg.ESPRUINO_JSEXPR_TOOLTIP = 'Executes the given JavaScript code as an expression';
  Blockly.Msg.ESPRUINO_MOVE_SERVO = 'Move Servo on Pin';
  Blockly.Msg.ESPRUINO_TO = 'to';
  Blockly.Msg.ESPRUINO_MOVE_SERVO_TOOLTIP = 'Start moving the servo motor - position between -1 and 1';
  Blockly.Msg.ESPRUINO_STOP_SERVO = 'Stop Servo on Pin';
  Blockly.Msg.ESPRUINO_STOP_SERVO_TOOLTIP = 'Stop moving the servo motor';
  Blockly.Msg.ESPRUINO_ULTRASONIC_GET_TRIG = 'Get distance, trigger';
  Blockly.Msg.ESPRUINO_ULTRASONIC_ECHO = ', echo';
  Blockly.Msg.ESPRUINO_ULTRASONIC_TOOLTIP = 'Return distance in centimetres from the ultrasonic sensor';

}