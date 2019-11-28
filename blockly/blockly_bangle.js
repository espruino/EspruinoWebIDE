/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Blockly blocks for Bangle.js
 ------------------------------------------------------------------
**/

var BANGLE_COL = 0;
var BANGLE_ONOFF = [
  ["GPS","setGPSPower"],
  ["Compass","setCompassPower"],
  ["LCD","setLCDPower"],
  ["Heartrate","setHRMPower"]
];
var BANGLE_EVENTS = [
  ["Charging","charging"],
  ["LCD on/off","lcdPower"],
  ["GPS data","GPS"],
  ["Compass data","mag"],
  ["Accelerometer data","accel"],
  ["Step detected","step"]
];
var BANGLE_EVENT_PARAMS = {
  "charging" : "chargeState",
  "lcdPower" : "lcdPower",
  "GPS" : "gpsFix",
  "mag" : "compassData",
  "accel" : "accelData",
  "step" : "stepCount"
};
var BANGLE_DATA_BOOL = [
  ["Charging: State","chargeState"],
  ["LCD: power","lcdPower"],
  ["GPS: has fix?","gpsFix.fix!=0"],
];
var BANGLE_DATA_NUMBER = [
  ["GPS: latitude","gpsFix.lat"],
  ["GPS: longitude","gpsFix.lon"],
  ["GPS: speed (km/h)","gpsFix.speed"],
  ["GPS: course (degrees)","gpsFix.course"],
  ["Compass: heading (degrees)","compassData.heading"],
  ["Accelerometer: X","accelData.x"],
  ["Accelerometer: Y","accelData.y"],
  ["Accelerometer: magnitude","accelData.mag"],
  ["Accelerometer: difference","accelData.diff"],
  ["Step detected","stepCount"],
];

function bangleStatement(blk, comment) {
  blk.setPreviousStatement(true);
  blk.setNextStatement(true);
  blk.setColour(BANGLE_COL);
  blk.setInputsInline(true);
  blk.setTooltip(comment);
}
function bangleInput(blk, comment) {
  blk.setOutput(true, 'Number');
  blk.setColour(BANGLE_COL);
  blk.setInputsInline(true);
  blk.setTooltip(comment);
}
// ----------------------------------------------------------
Blockly.Blocks.bangle_buzz = {
  category: 'Bangle.js',
  init: function() {
    this.appendValueInput('LEN')
        .setCheck(['Number'])
        .appendField('Buzz for ');
    this.appendDummyInput()
        .appendField('ms')
    bangleStatement(this, 'Make Bangle.js buzz');
  }
};
Blockly.JavaScript.bangle_buzz = function() {
  var len = Blockly.JavaScript.valueToCode(this, 'LEN', Blockly.JavaScript.ORDER_ASSIGNMENT) || 0;
  return `Bangle.buzz(${len});\n`;
};
// ----------------------------------------------------------
Blockly.Blocks.bangle_beep = {
  category: 'Bangle.js',
  init: function() {
    this.appendValueInput('LEN')
        .setCheck(['Number'])
        .appendField('Beep for ');
    this.appendDummyInput()
        .appendField('ms at')
        this.appendValueInput('FREQ')
            .setCheck(['Number'])
            .appendField('Hz');
    bangleStatement(this, 'Make Bangle.js beep');
  }
};
Blockly.JavaScript.bangle_beep = function() {
  var len = Blockly.JavaScript.valueToCode(this, 'LEN', Blockly.JavaScript.ORDER_ASSIGNMENT) || 0;
  var freq = Blockly.JavaScript.valueToCode(this, 'FREQ', Blockly.JavaScript.ORDER_ASSIGNMENT) || 0;
  return `Bangle.beep(${len},${freq});\n`;
};
// ----------------------------------------------------------
Blockly.Blocks.bangle_turnon = {
  category: 'Bangle.js',
  init: function() {
    this.appendDummyInput().appendField('Turn on ').appendField(new Blockly.FieldDropdown(BANGLE_ONOFF), 'DEVICE');
    bangleStatement(this, 'Turn a peripheral on');
  }
};
Blockly.JavaScript.bangle_turnon = function() {
  var device = this.getFieldValue('DEVICE');
  return `Bangle.${device}(1);\n`;
};
// ----------------------------------------------------------
Blockly.Blocks.bangle_turnoff = {
  category: 'Bangle.js',
  init: function() {
    this.appendDummyInput().appendField('Turn off ').appendField(new Blockly.FieldDropdown(BANGLE_ONOFF), 'DEVICE');
    bangleStatement(this, 'Turn a peripheral off');
  }
};
Blockly.JavaScript.bangle_turnoff = function() {
  var device = this.getFieldValue('DEVICE');
  return `Bangle.${device}(0);\n`;
};
// ----------------------------------------------------------
Blockly.Blocks.bangle_on = {
  category: 'Bangle.js',
  init: function() {
    this.appendDummyInput().appendField('On ').appendField(new Blockly.FieldDropdown(BANGLE_EVENTS), 'DEVICE');
    this.appendStatementInput('DO')
         .appendField('do');
    bangleStatement(this, 'Called when ');
  }
};
Blockly.JavaScript.bangle_on = function() {
  var device = this.getFieldValue('DEVICE');
  var branch = Blockly.JavaScript.statementToCode(this, 'DO');
  return `Bangle.on('${device}',function(${BANGLE_EVENT_PARAMS[device]}) {\n${branch}\n});\n`;
};
// ----------------------------------------------------------
Blockly.Blocks.bangle_result_bool = {
  category: 'Bangle.js',
  init: function() {
    this.appendDummyInput().appendField('data').appendField(new Blockly.FieldDropdown(BANGLE_DATA_BOOL), 'EVENT');
    bangleInput(this, 'Boolean data from a Bangle event');
    this.setOutput(true, 'Boolean');
    this.setColour(Blockly.Msg.LOGIC_HUE);
  }
};
Blockly.JavaScript.bangle_result_bool = function() {
  var event = this.getFieldValue('EVENT');
  return [event, Blockly.JavaScript.ORDER_ATOMIC];
};
// ----------------------------------------------------------
Blockly.Blocks.bangle_result_number = {
  category: 'Bangle.js',
  init: function() {
    this.appendDummyInput().appendField('data').appendField(new Blockly.FieldDropdown(BANGLE_DATA_NUMBER), 'EVENT');
    bangleInput(this, 'Numeric data from a Bangle event');
    this.setOutput(true, 'Number');
    this.setColour(Blockly.Msg.MATH_HUE);
  }
};
Blockly.JavaScript.bangle_result_number = function() {
  var event = this.getFieldValue('EVENT');
  return [event, Blockly.JavaScript.ORDER_ATOMIC];
};
// ----------------------------------------------------------
