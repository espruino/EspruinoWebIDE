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
Blockly.Blocks.robot_motor_l = {
  category: 'Robot',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number','Boolean'])
          .appendField('Set Left Servo Speed');
    robotStatement(this, 'Changes the speed of the motor');
  }
};
Blockly.JavaScript.robot_motor_l = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "if (Math.abs("+val+")<0.05) digitalWrite(B13,0); else analogWrite(B13, (1.5+0.7*("+val+"))/20, {freq:50});\n";
};
// ----------------------------------------------------------
Blockly.Blocks.robot_motor_r = {
  category: 'Robot',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number','Boolean'])
          .appendField('Set Right Servo Speed');
    robotStatement(this, 'Changes the speed of the motor');
  }
};
Blockly.JavaScript.robot_motor_r = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "if (Math.abs("+val+")<0.05) digitalWrite(B14,0); else analogWrite(B14, (1.5-0.7*("+val+"))/20, {freq:50});\n";
};
// ----------------------------------------------------------
Blockly.Blocks.robot_led_l = {
  category: 'Robot',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number','Boolean'])
          .appendField('Set Left LED');
    robotStatement(this, 'Turns the LED Light on or off');
  }
};
Blockly.JavaScript.robot_led_l = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "digitalWrite(B7, "+val+");\n";
};
// ----------------------------------------------------------
Blockly.Blocks.robot_led_m = {
  category: 'Robot',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number','Boolean'])
          .appendField('Set Middle LED');
    robotStatement(this, 'Turns the LED Light on or off');
  }
};
Blockly.JavaScript.robot_led_m = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "digitalWrite(B5, "+val+");\n";
};
// ----------------------------------------------------------
Blockly.Blocks.robot_led_r = {
  category: 'Robot',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number','Boolean'])
          .appendField('Set Right LED');
    robotStatement(this, 'Turns the LED Light on or off');
  }
};
Blockly.JavaScript.robot_led_r = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "digitalWrite(B6, "+val+");\n";
};
// ----------------------------------------------------------
Blockly.Blocks.robot_ldr_ul = {
  category: 'Robot',
  init: function() {
      this.appendDummyInput().appendField('Upper Left LDR');
    robotInput(this, 'Get the amount of light falling on the sensor');
  }
};
Blockly.JavaScript.robot_ldr_ul = function() {return ["analogRead(B1)\n", Blockly.JavaScript.ORDER_ATOMIC]; };
// ----------------------------------------------------------
Blockly.Blocks.robot_ldr_ll = {
  category: 'Robot',
  init: function() {
      this.appendDummyInput().appendField('Lower Left LDR');
    robotInput(this, 'Get the amount of light falling on the sensor');
  }
};
Blockly.JavaScript.robot_ldr_ll = function() {return ["analogRead(A7)\n", Blockly.JavaScript.ORDER_ATOMIC]; };
// ----------------------------------------------------------
Blockly.Blocks.robot_ldr_ur = {
  category: 'Robot',
  init: function() {
      this.appendDummyInput().appendField('Upper Right LDR');
    robotInput(this, 'Get the amount of light falling on the sensor');
  }
};
Blockly.JavaScript.robot_ldr_ur = function() {return ["analogRead(A5)\n", Blockly.JavaScript.ORDER_ATOMIC]; };
// ----------------------------------------------------------
Blockly.Blocks.robot_ldr_lr = {
  category: 'Robot',
  init: function() {
      this.appendDummyInput().appendField('Lower Right LDR');
    robotInput(this, 'Get the amount of light falling on the sensor');
  }
};
Blockly.JavaScript.robot_ldr_lr = function() {return ["analogRead(A6)\n", Blockly.JavaScript.ORDER_ATOMIC]; };

