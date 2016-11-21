/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)
           2016 Vasiliev Mikhail (mickvav@gmail.com)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Blockly blocks for Amperka Motor Shield
 ------------------------------------------------------------------
**/    

var ROBOT_COL = 170;


function amperka_motorshieldStatement(blk, comment) {
  blk.setPreviousStatement(true);
  blk.setNextStatement(true);
  blk.setColour(ROBOT_COL);
  blk.setInputsInline(true);
  blk.setTooltip(comment);
}
function amperka_motorshieldInput(blk, comment) {
  blk.setOutput(true, 'Number');
  blk.setColour(ROBOT_COL);
  blk.setInputsInline(true);
  blk.setTooltip(comment);
}

// ----------------------------------------------------------
Blockly.Blocks.amperka_motorshield_motor = {
  category: 'MotorShield',
  init: function() {
    var dropdown = new Blockly.FieldDropdown([
        ['Right(M2)', 'B0'], 
        ['Left(M1)', 'B1'], 
        ]);
      this.appendValueInput('VAL')
          .setCheck(['Number'])
          .appendField('Set')
          .appendField(dropdown, 'PIN')
          .appendField('Motor Speed');
    amperka_motorshieldStatement(this, 'Changes the speed of the motor');
  }
};
Blockly.JavaScript.amperka_motorshield_motor = function() {
  var pin = this.getTitleValue('PIN');
  var mul = (pin=="B1") ? "-1" : "+1";
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "var x = "+val+";\nanalogWrite("+pin+", "+mul+"*x);\n";
};
// ----------------------------------------------------------
Blockly.Blocks.amperka_motorshield_motor_dir = {
  category: 'MotorShield',
  init: function() {
    var dropdown = new Blockly.FieldDropdown([
        ['Right', 'C2'], 
        ['Left', 'C3'], 
        ]);
      this.appendValueInput('VAL')
          .setCheck(['Boolean'])
          .appendField('Set')
          .appendField(dropdown, 'PIN')
          .appendField('Motor Direction');
    amperka_motorshieldStatement(this, 'Changes the direction of the motor');
  }
};
Blockly.JavaScript.amperka_motorshield_motor = function() {
  var pin = this.getTitleValue('PIN');
  var m1 = (pin=="C3") ? "1" : "0";
  var m2 = (pin=="C3") ? "0" : "1";
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || 'false';
  return "var x = "+val+";\nif (x) digitalWrite("+pin+","+m1+"); else digitalWrite("+pin+", "+m2+");\n";
};


