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

// ------------------

Blockly.Blocks.smartibot_M1Fwd = {
  category: 'Espurino',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number','Boolean'])
          .appendField(Blockly.Msg.SMARTIBOT_M1FWD);

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(SMARTIBOT_COL);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.ESPRUINO_M1FWD_TOOLTIP);
  }
};


Blockly.Blocks.smartibot_M1Bwd = {
  category: 'Espurino',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number','Boolean'])
          .appendField(Blockly.Msg.SMARTIBOT_M1BWD);

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(SMARTIBOT_COL);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.ESPRUINO_M1BWD_TOOLTIP);
  }
};

Blockly.Blocks.smartibot_M2Fwd = {
  category: 'Espurino',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number','Boolean'])
          .appendField(Blockly.Msg.SMARTIBOT_M2FWD);

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(SMARTIBOT_COL);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.ESPRUINO_M2FWD_TOOLTIP);
  }
};


Blockly.Blocks.smartibot_M2Bwd = {
  category: 'Espurino',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number','Boolean'])
          .appendField(Blockly.Msg.SMARTIBOT_M2BWD);

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(SMARTIBOT_COL);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.ESPRUINO_M2BWD_TOOLTIP);
  }
};

Blockly.Blocks.smartibot_M3Fwd = {
  category: 'Espurino',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number','Boolean'])
          .appendField(Blockly.Msg.SMARTIBOT_M3FWD);

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(SMARTIBOT_COL);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.ESPRUINO_M3FWD_TOOLTIP);
  }
};

Blockly.Blocks.smartibot_M3Bwd = {
  category: 'Espurino',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number','Boolean'])
          .appendField(Blockly.Msg.SMARTIBOT_M3BWD);

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(SMARTIBOT_COL);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.ESPRUINO_M3BWD_TOOLTIP);
  }
};

Blockly.Blocks.smartibot_M4Fwd = {
  category: 'Espurino',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number','Boolean'])
          .appendField(Blockly.Msg.SMARTIBOT_M4FWD);

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(SMARTIBOT_COL);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.ESPRUINO_M4FWD_TOOLTIP);
  }
};


Blockly.Blocks.smartibot_M4Bwd = {
  category: 'Espurino',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number','Boolean'])
          .appendField(Blockly.Msg.SMARTIBOT_M4BWD);

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(SMARTIBOT_COL);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.ESPRUINO_M4BWD_TOOLTIP);
  }
};

// --------------------------------

Blockly.Blocks.smartibot_LED = {
  category: 'Espurino',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number'])
          .appendField(Blockly.Msg.SMARTIBOT_LED1);
      this.appendValueInput('VAL2')
          .setCheck(['Number'])
          .appendField(Blockly.Msg.SMARTIBOT_LED1G);
      this.appendValueInput('VAL3')
          .setCheck(['Number'])
          .appendField(Blockly.Msg.SMARTIBOT_LED1B);
      this.appendValueInput('VAL4')
          .setCheck(['Number'])
          .appendField(Blockly.Msg.SMARTIBOT_LED2);
      this.appendValueInput('VAL5')
          .setCheck(['Number'])
          .appendField(Blockly.Msg.SMARTIBOT_LED2G);
      this.appendValueInput('VAL6')
          .setCheck(['Number'])
          .appendField(Blockly.Msg.SMARTIBOT_LED2B);

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(SMARTIBOT_COL);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.ESPRUINO_M4BWD_TOOLTIP);
  }
};

Blockly.Blocks.smartibot_LEDorange = {
  category: 'Espurino',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number'])
          .appendField(Blockly.Msg.SMARTIBOT_LEDORANGE);

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(35);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.ESPRUINO_M4BWD_TOOLTIP);
  }
};

Blockly.Blocks.smartibot_LEDpink = {
  category: 'Espurino',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number'])
          .appendField(Blockly.Msg.SMARTIBOT_LEDPINK);

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(310);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.ESPRUINO_M4BWD_TOOLTIP);
  }
};

Blockly.Blocks.smartibot_LEDblue = {
  category: 'Espurino',
  init: function() {
      this.appendValueInput('VAL')
          .setCheck(['Number'])
          .appendField(Blockly.Msg.SMARTIBOT_LEDBLUE);

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(190);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg.ESPRUINO_M4BWD_TOOLTIP);
  }
};

// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------

Blockly.JavaScript.smartibot_M1Fwd = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "digitalWrite(D6, 0);\nanalogWrite(D4, "+val+");\n";
};

Blockly.JavaScript.smartibot_M1Bwd = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "digitalWrite(D4, 0);\nanalogWrite(D6, "+val+");\n";
};

Blockly.JavaScript.smartibot_M2Fwd = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "digitalWrite(D11, 0);\nanalogWrite(D10, "+val+");\n";
};

Blockly.JavaScript.smartibot_M2Bwd = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "digitalWrite(D10, 0);\nanalogWrite(D11, "+val+");\n";
};

Blockly.JavaScript.smartibot_M3Fwd = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "digitalWrite(D3, 0);\nanalogWrite(D2, "+val+");\n";
};

Blockly.JavaScript.smartibot_M3Bwd = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "digitalWrite(D2, 0);\nanalogWrite(D3, "+val+");\n";
};

Blockly.JavaScript.smartibot_M4Fwd = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "digitalWrite(D12, 0);\nanalogWrite(D9, "+val+");\n";
};

Blockly.JavaScript.smartibot_M4Bwd = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "digitalWrite(D9, 0);\nanalogWrite(D12, "+val+");\n";
};

// ---------------------

Blockly.JavaScript.smartibot_LED = function() {
  var lr = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var lg = Blockly.JavaScript.valueToCode(this, 'VAL2', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var lb = Blockly.JavaScript.valueToCode(this, 'VAL3', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var rr = Blockly.JavaScript.valueToCode(this, 'VAL4', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var rg = Blockly.JavaScript.valueToCode(this, 'VAL5', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var rb = Blockly.JavaScript.valueToCode(this, 'VAL6', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var l = JSON.stringify([lr,lg,lb]);
  var r = JSON.stringify([rr,rg,rb]);
  return 'require("Smartibot").setLEDs('+l+','+r+');\n';
};

Blockly.JavaScript.smartibot_LEDorange = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var c = JSON.stringify([13*val,92*val,47*val]);
  return 'require("Smartibot").setLEDs('+c+','+c+');\n';
};

Blockly.JavaScript.smartibot_LEDpink = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var c = JSON.stringify([24*val,90*val,53*val]);
  return 'require("Smartibot").setLEDs('+c+','+c+');\n';
};

Blockly.JavaScript.smartibot_LEDblue = function() {
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var c = JSON.stringify([100*val,27*val,86*val]);
  return 'require("Smartibot").setLEDs('+c+','+c+');\n';
};
