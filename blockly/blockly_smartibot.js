/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Blockly blocks for Smartibot
 ------------------------------------------------------------------
**/


// ---------------------------------
var SMARTIBOT_COL = 290;

const SMARTIBOT_MOTORS = [
  ["M1", '1'],
  ["M2", '2'],
  ["M3", '3'],
  ["M4", '4']];
const SMARTIBOT_SERVOS = [
  ["S1", '1'],
  ["S2", '2'],
  ["S3", '3'],
  ["S4", '4'],
  ["S5", '5'],
  ["S6", '6'],
  ["S7", '7'],
  ["S8", '8'],
  ["S9", '9'],
  ["S10", '10']];
const SMARTIBOT_COLORS = [
  ["Orange", '[47,92,13]'],
  ["Pink", '[53,90,24]'],
  ["Blue", '[86,27,100]'],
  ["Off", '[0,0,0]']];

// ------------------

Blockly.Blocks.smartibot_motor = {
  category: 'Smartibot',
  init: function() {
    this.appendDummyInput().appendField("Motor")
         .appendField(new Blockly.FieldDropdown(SMARTIBOT_MOTORS), 'MOTOR')
         .appendField("speed");
    this.appendValueInput('VAL').setCheck(['Number','Boolean']);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(SMARTIBOT_COL);
    this.setInputsInline(true);
    //this.setTooltip("...");
  }
};

Blockly.Blocks.smartibot_servo = {
  category: 'Smartibot',
  init: function() {
    this.appendDummyInput().appendField("Servo")
         .appendField(new Blockly.FieldDropdown(SMARTIBOT_SERVOS), 'SERVO')
         .appendField("position");
    this.appendValueInput('VAL').setCheck(['Number','Boolean']);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(SMARTIBOT_COL);
    this.setInputsInline(true);
    //this.setTooltip("...");
  }
};

Blockly.Blocks.smartibot_LED = {
  category: 'Smartibot',
  init: function() {
      this.appendValueInput('LR')
          .setCheck(['Number'])
          .appendField("EYES Left - R:");
      this.appendValueInput('LG')
          .setCheck(['Number'])
          .appendField("G:");
      this.appendValueInput('LB')
          .setCheck(['Number'])
          .appendField("B:");
      this.appendValueInput('RR')
          .setCheck(['Number'])
          .appendField('Right - R:');
      this.appendValueInput('RG')
          .setCheck(['Number'])
          .appendField("G:");
      this.appendValueInput('RB')
          .setCheck(['Number'])
          .appendField("B:");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(SMARTIBOT_COL);
    this.setInputsInline(true);
    //this.setTooltip("...");
  }
};

Blockly.Blocks.smartibot_LEDcol = {
  category: 'Smartibot',
  init: function() {
    this.appendDummyInput().appendField("EYES")
         .appendField(new Blockly.FieldDropdown(SMARTIBOT_COLORS), 'COL')
         .appendField("Brightness:");
    this.appendValueInput('BRIGHT').setCheck(['Number']);

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(SMARTIBOT_COL);
    this.setInputsInline(true);
    //this.setTooltip("...");
  }
};

// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------

Blockly.JavaScript.smartibot_motor = function() {
  var motor = this.getFieldValue('MOTOR');
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return 'require("Smartibot").setMotor('+motor+','+val+');\n';
};

Blockly.JavaScript.smartibot_servo = function() {
  var servo = this.getFieldValue('SERVO');
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return 'require("Smartibot").setServo('+servo+','+val+');\n';
};

Blockly.JavaScript.smartibot_LED = function() {
  var lr = Blockly.JavaScript.valueToCode(this, 'LR', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var lg = Blockly.JavaScript.valueToCode(this, 'LG', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var lb = Blockly.JavaScript.valueToCode(this, 'LB', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var rr = Blockly.JavaScript.valueToCode(this, 'RR', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var rg = Blockly.JavaScript.valueToCode(this, 'RG', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var rb = Blockly.JavaScript.valueToCode(this, 'RB', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var l = JSON.stringify([lr,lg,lb]);
  var r = JSON.stringify([rr,rg,rb]);
  return 'require("Smartibot").setLEDs('+l+','+r+');\n';
};

Blockly.JavaScript.smartibot_LEDcol = function() {
  var col = this.getFieldValue('COL');
  var bright = Blockly.JavaScript.valueToCode(this, 'BRIGHT', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  col = col+'.map(x=>x*'+bright+')';
  return 'require("Smartibot").setLEDs('+col+','+col+');\n';
};
