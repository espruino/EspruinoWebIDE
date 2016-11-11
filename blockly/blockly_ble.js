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
  //blk.setInputsInline(true);
  blk.setTooltip(comment);
}
function bleInput(blk, comment, type) {
  blk.setOutput(true, type||'Number');
  blk.setColour(BLE_COL);
  //blk.setInputsInline(true);
  blk.setTooltip(comment);
}

var BLE_CHARACTERISTICS = [
        ['Digital', ['0001','2A56']],
        ['Analog', ['0001','2A58']],
        ['Temperature', ['0001','2A6E']]
];

function bleUpdateServices(service) {
  var currService = Blockly.JavaScript.definitions_["NRF.setServices"];
  if (currService===undefined) {
    currService = {};
  } else {
    currService = currService.substring("NRF.setServices(".length, currService.length-2)
    currService = JSON.parse(currService);
  }
  for (var n in service)
    currService[n] = service[n];
  Blockly.JavaScript.definitions_["NRF.setServices"] =
    "NRF.setServices("+JSON.stringify(currService)+");";
}

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
  return "NRF.on('connect', function() {\n"+code+"});\n";
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
  return "NRF.on('disconnect', function() {\n"+code+"});\n";
};
// ============================================================================

Blockly.Blocks.ble_dev_name = {
  category: 'BLE',
  init: function() {
    this.appendDummyInput().
      appendField('Device Named').
      appendField(new Blockly.FieldTextInput("Puck.js ABCD"), 'NAME');
    bleInput(this, '', 'BLEDevice');
  }
};
Blockly.JavaScript.ble_dev_name = function() {
  var name = this.getFieldValue('NAME');
  return ["NRF.requestDevice({ filters: [{ name: "+JSON.stringify(name)+" }] }).then(function(device) {\n"+
  "  return device.gatt.connect();\n"+
  "})", Blockly.JavaScript.ORDER_ATOMIC];
};

// ----------------------------------------------------------

Blockly.Blocks.ble_dev_prefix = {
  category: 'BLE',
  init: function() {
    this.appendDummyInput().
      appendField('Device Starting with').
      appendField(new Blockly.FieldTextInput("Puck.js"), 'NAME');
    bleInput(this, '', 'BLEDevice');
  }
};
Blockly.JavaScript.ble_dev_prefix = function() {
  var name = this.getFieldValue('NAME');
  return ["NRF.requestDevice({ filters: [{ namePrefix: "+JSON.stringify(name)+" }] }).then(function(device) {\n"+
  "  return device.gatt.connect();\n"+
  "})", Blockly.JavaScript.ORDER_ATOMIC];
};

// ----------------------------------------------------------

Blockly.Blocks.ble_dev_address = {
  category: 'BLE',
  init: function() {
    this.appendDummyInput().
      appendField('Device Address').
      appendField(new Blockly.FieldTextInput("Puck.js"), 'ADDR');
    bleInput(this, '', 'BLEDevice');
  }
};
Blockly.JavaScript.ble_dev_address = function() {
  var addr = this.getFieldValue('ADDR');
  return ["NRF.connect("+JSON.stringify(addr)+")", Blockly.JavaScript.ORDER_ATOMIC];
};

// ============================================================================

Blockly.Blocks.ble_characteristic = {
  category: 'BLE',
  init: function() {
    this.appendDummyInput()
        .appendField('Characteristic ')
        .appendField(new Blockly.FieldTextInput("0001"), 'SERV')
        .appendField(':')
        .appendField(new Blockly.FieldTextInput("2A56"), 'CHAR');
    bleInput(this, '', 'BLECharacteristic');
  }
};
Blockly.JavaScript.ble_characteristic = function() {
  return [[this.getFieldValue('SERV'), this.getFieldValue('CHAR')], Blockly.JavaScript.ORDER_ATOMIC];
};

// ----------------------------------------------------------

Blockly.Blocks.ble_characteristic_dropdown = {
  category: 'BLE',
  init: function() {
    this.appendDummyInput()
        .appendField('[BLE] Characteristic ')
      .appendField(new Blockly.FieldDropdown(BLE_CHARACTERISTICS), 'CHAR')
    bleInput(this, '', 'BLECharacteristic');
  }
};
Blockly.JavaScript.ble_characteristic_dropdown = function() {
  return [this.getFieldValue('CHAR'), Blockly.JavaScript.ORDER_ATOMIC];
};

// ============================================================================
Blockly.Blocks.ble_setchar = {
  category: 'BLE',
  init: function() {
      this.appendValueInput('CHAR').setCheck(['BLECharacteristic']).appendField('[BLE] Set');
      this.appendValueInput('DEV').setCheck(['BLEDevice']).appendField('on');
      this.appendValueInput('VAL').setCheck(['Number','Boolean']).appendField('to');
      this.appendStatementInput('DO').appendField('then');
    bleStatement(this, 'Sets a value on a BLE device');
  }
};
Blockly.JavaScript.ble_setchar = function() {
  var char = Blockly.JavaScript.valueToCode(this, 'CHAR', Blockly.JavaScript.ORDER_ASSIGNMENT);
  var dev = Blockly.JavaScript.valueToCode(this, 'DEV', Blockly.JavaScript.ORDER_ASSIGNMENT);
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var code = Blockly.JavaScript.statementToCode(this, 'DO');
  if (!dev || !char) return "";
  char = char.split(",");
  if (!code) code="";
  return "(function() {\n"+
"  var gatt;\n"+
"  "+dev+".then(function(g) {\n"+
"    gatt = g;\n"+
"    return gatt.getPrimaryService("+JSON.stringify(char[0])+");\n"+
"  }).then(function(service) {\n"+
"    return service.getCharacteristic("+JSON.stringify(char[1])+");\n"+
"  }).then(function(characteristic) {\n"+
"    characteristic.writeValue("+JSON.stringify(val)+");\n"+
"  }).then(function() {\n"+
"    gatt.disconnect();\n"+
"    "+code+"\n"+
"  });\n"+
"})()"
};
// ----------------------------------------------------------
Blockly.Blocks.ble_getchar = {
  category: 'BLE',
  init: function() {
    this.appendValueInput('CHAR').setCheck(['BLECharacteristic']).appendField('[BLE] Get');
    this.appendValueInput('DEV').setCheck(['BLEDevice']).appendField('from');
    this.appendStatementInput('DO').appendField('then');
    bleStatement(this, 'Gets a value from a BLE device');
  }
};
Blockly.JavaScript.ble_getchar = function() {
  var char = Blockly.JavaScript.valueToCode(this, 'CHAR', Blockly.JavaScript.ORDER_ASSIGNMENT);
  var dev = Blockly.JavaScript.valueToCode(this, 'DEV', Blockly.JavaScript.ORDER_ASSIGNMENT);
  var code = Blockly.JavaScript.statementToCode(this, 'DO');
  if (!dev || !char) return "";
  char = char.split(",");
  if (!code) code="";
  return "(function() {\n"+
"  var gatt;\n"+
"  "+dev+".then(function(g) {\n"+
"    gatt = g;\n"+
"    return gatt.getPrimaryService("+JSON.stringify(char[0])+");\n"+
"  }).then(function(service) {\n"+
"    return service.getCharacteristic("+JSON.stringify(char[1])+");\n"+
"  }).then(function(characteristic) {\n"+
"    characteristic.readValue();\n"+
"  }).then(function(value) {\n"+
"    ble_value = value;\n"+
"    gatt.disconnect();\n"+
"    "+code+"\n"+
"  });\n"+
"})()\n";
};
// ----------------------------------------------------------
Blockly.Blocks.ble_write = {
  category: 'BLE',
  init: function() {
    this.appendValueInput('CHAR').setCheck(['BLECharacteristic']).appendField('[BLE] Set');
    this.appendValueInput('VAL').setCheck(['Number','Boolean']).appendField('to');
    bleStatement(this, "Set Espruino's BLE characteristic to the given value");
  }
};
Blockly.JavaScript.ble_write = function() {
  var char = Blockly.JavaScript.valueToCode(this, 'CHAR', Blockly.JavaScript.ORDER_ASSIGNMENT);
  var value = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  if (!char) return "";
  char = char.split(",");
  var service = {};
  service[char[0]] = {};
  service[char[0]][char[1]] = {
    readable : true,
    notify : true
  };
  bleUpdateServices(service);
  return "NRF.updateServices({\n"+
"  "+JSON.stringify(char[0])+" : {\n"+
"    "+JSON.stringify(char[1])+" : {\n"+
"      value : "+value+",\n"+
"      notify: true\n"+
"    }\n"+
"  }\n"+
"});\n";
};
// ----------------------------------------------------------
Blockly.Blocks.ble_onwritten = {
  category: 'BLE',
  init: function() {
    this.appendValueInput('CHAR').setCheck(['BLECharacteristic']).appendField('[BLE] When');
    this.appendStatementInput('DO').appendField('changed, do');
    bleStatement(this, "Called when a BLE characteristic is written on Espruino");
  }
};
Blockly.JavaScript.ble_onwritten = function() {
  var char = Blockly.JavaScript.valueToCode(this, 'CHAR', Blockly.JavaScript.ORDER_ASSIGNMENT);
  var code = Blockly.JavaScript.statementToCode(this, 'DO');
  if (!char) return "";
  char = char.split(",");
  service[char[0]] = {};
  service[char[0]][char[1]] = {
    readable : true,
    writable : true,
    notify : true,
    onWrite : function(value) { //FIXME: won't work with JSON.parse
      ble_value = value
    }
  };
  bleUpdateServices(service);
  return "";
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
