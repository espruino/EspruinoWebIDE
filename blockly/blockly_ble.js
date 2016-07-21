/**
 Copyright 2016 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Blockly blocks for Espruino BLE
 ------------------------------------------------------------------
**/    

var BLE_COL = 210;


function bleStatement(blk, comment) {
  blk.setPreviousStatement(true);
  blk.setNextStatement(true);
  blk.setColour(BLE_COL);
  blk.setInputsInline(true);
  blk.setTooltip(comment);
}
function bleInput(blk, comment) {
  blk.setOutput(true, 'Number');
  blk.setColour(BLE_COL);
  blk.setInputsInline(true);
  blk.setTooltip(comment);
}

var BLE_CHARACTERISTICS = [
        ['Digital', '0x2A56'],  
        ['Analog', '0x2A58'],
        ['Temperature', '0x2A6E']
        //['URI', '0x2AB6']
];

// ----------------------------------------------------------
Blockly.Blocks.ble_connected = {
  category: 'BLE',
  init: function() {
    this.appendDummyInput().appendField('[BLE] When Connected');
    this.appendStatementInput('DO').appendField('do');
    bleStatement(this, 'Run code on BLE event');
  }
};
Blockly.JavaScript.ble_connected = function() {
  var code = Blockly.JavaScript.statementToCode(this, 'DO');
  return "NRF.on('serverconnect', function() {\n"+code+"}); // FIXME: unimplemented\n";
};
// ----------------------------------------------------------
Blockly.Blocks.ble_disconnected = {
  category: 'BLE',
  init: function() {
    this.appendDummyInput().appendField('[BLE] When Disconnected');
    this.appendStatementInput('DO').appendField('do');
    bleStatement(this, 'Run code on BLE event');
  }
};
Blockly.JavaScript.ble_disconnected = function() {
  var code = Blockly.JavaScript.statementToCode(this, 'DO');
  return "NRF.on('serverdisconnect', function() {\n"+code+"}); // FIXME: unimplemented\n";
};
// ----------------------------------------------------------
Blockly.Blocks.ble_setchar = {
  category: 'BLE',
  init: function() {
      this.appendDummyInput()
          .appendField('[BLE] Set')
          .appendField(new Blockly.FieldDropdown(BLE_CHARACTERISTICS), 'CHAR')
      this.appendDummyInput().appendField('on address');
      this.appendValueInput('ADDR').setCheck(['String']);        
      this.appendValueInput('VAL').setCheck(['Number','Boolean']).appendField('to');         
    
    bleStatement(this, 'Sets a value on a BLE device');
  }
};
Blockly.JavaScript.ble_setchar = function() {
  var addr = Blockly.JavaScript.valueToCode(this, 'ADDR', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var char = this.getTitleValue('CHAR');
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return
"NRF.on('connect', function() {\n"+
"  NRF.on('servicesDiscover', function(services) {\n"+
"    NRF.on('characteristicsDiscover', function(c) {\n"+
"      c[0].write("+val+")\n"+
"    });\n"+
"    services[services.length-1].discoverCharacteristics("+char+");\n"+
"  });\n"+
"NRF.discoverServices();\n"+
"});\n"+
"NRF.connect("+JSON.stringify(addr)+")\n";
};
// ----------------------------------------------------------
Blockly.Blocks.ble_getchar = {
  category: 'BLE',
  init: function() {    
      this.appendDummyInput()
          .appendField('[BLE] Get')
          .appendField(new Blockly.FieldDropdown(BLE_CHARACTERISTICS), 'CHAR');
      this.appendDummyInput().appendField('from address');
      this.appendValueInput('ADDR').setCheck(['String']);                              
      this.appendStatementInput('DO').appendField('when ready do');
    bleStatement(this, 'Gets a value from a BLE device');
  }
};
Blockly.JavaScript.ble_getchar = function() {
  var addr = Blockly.JavaScript.valueToCode(this, 'ADDR', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var char = this.getTitleValue('CHAR');
  var code = Blockly.JavaScript.statementToCode(this, 'DO');
  return
"NRF.on('connect', function() {\n"+
"  NRF.on('servicesDiscover', function(services) {\n"+
"    NRF.on('characteristicsDiscover', function(c) {\n"+
"      c[0].read(function(ble_value) {"+code+"})\n"+
"    });\n"+
"    services[services.length-1].discoverCharacteristics("+char+");\n"+
"  });\n"+
"NRF.discoverServices();\n"+
"});\n"+
"NRF.connect("+JSON.stringify(addr)+")\n";
};
// ----------------------------------------------------------
Blockly.Blocks.ble_write = {
  category: 'BLE',
  init: function() {
    this.appendDummyInput()
        .appendField('[BLE] Set')
        .appendField(new Blockly.FieldDropdown(BLE_CHARACTERISTICS), 'CHAR')
        .appendField('to');
    this.appendValueInput('VAL').setCheck(['Number','Boolean'])          
    bleStatement(this, "Set Espruino's BLE characteristic to the given value");
  }
};
Blockly.JavaScript.ble_written = function() {
  var char = this.getTitleValue('CHAR');
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return 
"NRF.setServices({ // FIXME: should set all services in one go\n"+
"  0xBCDE : {\n"+
"    "+char+" : {\n"+
"      value : "+value+", // optional\n"+
"      maxLen : 1, // optional (otherwise is length of initial value)\n"+
"      broadcast : false, // optional, default is false\n"+
"      readable : true,   // optional, default is false\n"+
"      writable : true,   // optional, default is false\n"+
"      onWrite : function(ble_value) {"+code+"}\n"+
"    }\n"+
"  }\n"+
"});\n";
};
// ----------------------------------------------------------
Blockly.Blocks.ble_written = {
  category: 'BLE',
  init: function() {
    this.appendDummyInput()
        .appendField('[BLE] When')
        .appendField(new Blockly.FieldDropdown(BLE_CHARACTERISTICS), 'CHAR')
        .appendField('written');
    this.appendStatementInput('DO').appendField('do');
    bleStatement(this, "Called when a BLE characteristic is written on Espruino");
  }
};
Blockly.JavaScript.ble_written = function() {
  var char = this.getTitleValue('CHAR');
  var code = Blockly.JavaScript.statementToCode(this, 'DO');
  return 
"NRF.setServices({ // FIXME: should set all services in one go\n"+
"  0xBCDE : {\n"+
"    "+char+" : {\n"+
"      value : '0', // optional\n"+
"      maxLen : 1, // optional (otherwise is length of initial value)\n"+
"      broadcast : false, // optional, default is false\n"+
"      readable : true,   // optional, default is false\n"+
"      writable : true,   // optional, default is false\n"+
"      onWrite : function(ble_value) {"+code+"}\n"+
"    }\n"+
"  }\n"+
"});\n";
};
// ----------------------------------------------------------
Blockly.Blocks.ble_value = {
  category: 'BLE',
  init: function() {
    this.appendDummyInput().appendField('[BLE] Value');
    bleInput(this, 'The value from the last BLE operation');
  }
};
Blockly.JavaScript.ble_value = function() {
  return "ble_value";
};


