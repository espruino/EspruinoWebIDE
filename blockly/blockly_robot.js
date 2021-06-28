/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Blockly blocks for Espruino Robot
 ------------------------------------------------------------------

Expects board is pre-flashed with code:

function motor(left, right) {
   // left/right are -1..1
   // 1,1 == forward
   // 0,0 == stop
   // -1,-1 == back
}

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
Blockly.Blocks.robot_fwd = {
  category: 'Robot',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number'])
          .appendField('\u2b06\ufe0f Forward')
      this.appendDummyInput()
          .appendField(Blockly.Msg.ESPRUINO_SECONDS);
    robotStatement(this, 'Move forward');
  }
};
Blockly.JavaScript.robot_fwd = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "motor(1,1);\nsetTimeout(function() {\n  motor(0,0);\nsetTimeout("+MAGIC_CALLBACK_CODE+", 10);\n }, 1000*"+val+");\n";
};
// ----------------------------------------------------------
Blockly.Blocks.robot_back = {
  category: 'Robot',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number'])
          .appendField('\u2b07\ufe0f Back')
      this.appendDummyInput()
          .appendField(Blockly.Msg.ESPRUINO_SECONDS);
    robotStatement(this, 'Move back');
  }
};
Blockly.JavaScript.robot_back = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "motor(-1,-1);\nsetTimeout(function() {\n  motor(0,0);\nsetTimeout("+MAGIC_CALLBACK_CODE+", 10);\n }, 1000*"+val+");\n";
};
// ----------------------------------------------------------
Blockly.Blocks.robot_left = {
  category: 'Robot',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number'])
          .appendField('\u2b05\ufe0f Left')
      this.appendDummyInput()
          .appendField(Blockly.Msg.ESPRUINO_SECONDS);
    robotStatement(this, 'Move left');
  }
};
Blockly.JavaScript.robot_left = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "motor(-1,1);\nsetTimeout(function() {\n  motor(0,0);\nsetTimeout("+MAGIC_CALLBACK_CODE+", 10);\n }, 1000*"+val+");\n";
};
// ----------------------------------------------------------
Blockly.Blocks.robot_right = {
  category: 'Robot',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number'])
          .appendField('\u27a1\ufe0f Right')
      this.appendDummyInput()
          .appendField(Blockly.Msg.ESPRUINO_SECONDS);
    robotStatement(this, 'Move right');
  }
};
Blockly.JavaScript.robot_right = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "motor(1,-1);\nsetTimeout(function() {\n  motor(0,0);\nsetTimeout("+MAGIC_CALLBACK_CODE+", 10);\n }, 1000*"+val+");\n";
};
