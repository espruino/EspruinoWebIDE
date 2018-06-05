/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Blockly blocks for Espruino Robot
 ------------------------------------------------------------------
**/    

var ROBOT_COL = 160;


function robotStatement(blk, comment) {
  blk.setPreviousStatement(true);
  blk.setNextStatement(true);
  blk.setColour(ROBOT_COL);
  blk.setInputsInline(true);
  blk.setTooltip(comment);
}
function robotInput(blk, comment) {
  blk.setOutput(true, 'Number');
  blk.setColour(ROBOT_COL);
  blk.setInputsInline(true);
  blk.setTooltip(comment);
}

// ----------------------------------------------------------
Blockly.Blocks.robot_motor = {
  category: 'Robot',
  init: function() {
    var dropdown = new Blockly.FieldDropdown([
        ['Left', 'B13'], 
        ['Right', 'B14'], 
        ]);
      this.appendValueInput('VAL')
          .setCheck(['Number','Boolean'])
          .appendField('Set')
          .appendField(dropdown, 'PIN')
          .appendField('Servo Speed');
    robotStatement(this, 'Changes the speed of the motor');
  }
};
Blockly.JavaScript.robot_motor = function() {
  var pin = this.getFieldValue('PIN');
  var mul = (pin=="B14") ? "-0.7" : "+0.7";
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "var x = "+val+";\nif (Math.abs(x)<0.05) digitalWrite("+pin+",0); else analogWrite("+pin+", (1.5"+mul+"*x)/20, {freq:50});\n";
};
// ----------------------------------------------------------
Blockly.Blocks.robot_led = {
  category: 'Robot',
  init: function() {
    var dropdown = new Blockly.FieldDropdown([
        ['Left', 'B7'], 
        ['Middle', 'B5'],
        ['Right', 'B6'], 
        ['Green (on Pico)', 'LED2'],
        ['Red (on Pico)', 'LED1'],
        ]);
    this.appendValueInput('VAL')
         .setCheck(['Number','Boolean'])
         .appendField('Set')
         .appendField(dropdown, 'PIN')
         .appendField('LED');
    robotStatement(this, 'Turns the LED Light on or off');
  }
};
Blockly.JavaScript.robot_led = function() {
  var pin = this.getFieldValue('PIN');
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "digitalWrite("+pin+", "+val+");\n";
};
// ----------------------------------------------------------
Blockly.Blocks.robot_ldr = {
  category: 'Robot',
  init: function() {
    var dropdown = new Blockly.FieldDropdown([
        ['Upper Left', 'B1'], 
        ['Upper Right', 'A5'],
        ['Lower Left', 'A7'], 
        ['Lower Right', 'A6'],
        ]);
    this.appendDummyInput()
         .appendField(dropdown, 'PIN')
         .appendField('LDR');
    robotInput(this, 'Get the amount of light falling on the sensor');
  }
};
Blockly.JavaScript.robot_ldr = function() {
  var pin = this.getFieldValue('PIN');
  return ["analogRead("+pin+")", Blockly.JavaScript.ORDER_ATOMIC]; 
  //return ["(Math.max(0,analogRead("+pin+")-0.25)/0.75)", Blockly.JavaScript.ORDER_ATOMIC]; 
};
