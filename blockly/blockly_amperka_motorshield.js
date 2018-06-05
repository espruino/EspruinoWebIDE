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

var AMPERKA_MOTORSHIELD_COL = 200;


function amperka_motorshieldStatement(blk, comment) {
  blk.setPreviousStatement(true);
  blk.setNextStatement(true);
  blk.setColour(AMPERKA_MOTORSHIELD_COL);
  blk.setInputsInline(true);
  blk.setTooltip(comment);
}
function amperka_motorshieldInput(blk, comment) {
  blk.setOutput(true, 'Number');
  blk.setColour(AMPERKA_MOTORSHIELD_COL);
  blk.setInputsInline(true);
  blk.setTooltip(comment);
}

// ----------------------------------------------------------
Blockly.Blocks.amperka_motorshield_motor = {
  category: 'MotorShield',
  init: function() {
    var dropdown = new Blockly.FieldDropdown([
        [Blockly.Msg.AMPERKA_MOTORSHIELD_RIGHT , 'B0'], 
        [Blockly.Msg.AMPERKA_MOTORSHIELD_LEFT, 'B1'] 
        ]);
      this.appendValueInput('VAL')
          .setCheck(['Number'])
          .appendField(Blockly.Msg.AMPERKA_MOTORSHIELD_SET)
          .appendField(dropdown, 'PIN')
          .appendField(Blockly.Msg.AMPERKA_MOTORSHIELD_SPEED)
          .appendField(new Blockly.FieldImage("media/speed.png",16,16, ".:"));
    amperka_motorshieldStatement(this, Blockly.Msg.AMPERKA_MOTORSHIELD_SPEED_TOOLTIP);
  }
};
Blockly.JavaScript.amperka_motorshield_motor = function() {
  var pin = this.getFieldValue('PIN');
  var mul = (pin=="B1") ? "-1" : "+1";
  
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "var x = "+val+";\nanalogWrite("+pin+", x);\n";
};
// ----------------------------------------------------------
Blockly.Blocks.amperka_motorshield_motor_dir = {
  category: 'MotorShield',
  init: function() {
    var dropdown = new Blockly.FieldDropdown([
        [Blockly.Msg.AMPERKA_MOTORSHIELD_RIGHT, 'C2'], 
        [Blockly.Msg.AMPERKA_MOTORSHIELD_LEFT, 'C3'] 
        ]);
      this.appendValueInput('VAL')
          .setCheck(['Boolean'])
          .appendField(Blockly.Msg.AMPERKA_MOTORSHIELD_SET)
          .appendField(dropdown, 'PIN')
          .appendField('Motor Direction')
          .appendField(new Blockly.FieldImage("media/direction.png",16,16, "<->"));
    amperka_motorshieldStatement(this,Blockly.Msg.AMPERKA_MOTORSHIELD_DIRECTION_TOOLTIP );
  }
};
Blockly.JavaScript.amperka_motorshield_motor_dir = function() {
  var pin = this.getFieldValue('PIN');
  var m1 = (pin=="C3") ? "1" : "0";
  var m2 = (pin=="C3") ? "0" : "1";
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || 'false';
  return "var x = "+val+";\nif (x) digitalWrite("+pin+","+m1+"); else digitalWrite("+pin+", "+m2+");\n";
};


