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
        ['Digital', '0001,2A56'],
        ['Analog', '0001,2A58'],
        ['Temperature', '0001,2A6E'],
        ['UART TX', '6e400001b5a3f393e0a9e50e24dcca9e,6e400002b5a3f393e0a9e50e24dcca9e'],
        ['UART RX', '6e400001b5a3f393e0a9e50e24dcca9e,6e400003b5a3f393e0a9e50e24dcca9e']
];

function bleUpdateServices(service) {
  var currService = Blockly.JavaScript.definitions_["NRF.setServices"];
  if (currService===undefined) {
    currService = {};
  } else {
    currService = currService.substring("NRF.setServices(".length, currService.length-2)
    currService = currService.replace(/"onWrite":function\(v\){ble_value=v.data.toString\(\);([a-zA-Z0-9]*)\(\);}/g,'"onWrite":"$1"');
    currService = JSON.parse(currService);
  }
  for (var n in service)
    currService[n] = service[n];
  var str = JSON.stringify(currService);
  str = str.replace(/"onWrite":"([a-zA-Z0-9]*)"/g,'"onWrite":function(v){ble_value=v.data.toString();$1();}');
  Blockly.JavaScript.definitions_["NRF.setServices"] =
    "NRF.setServices("+str+");";
}

function formatCharacteristic(c) {
  // Sadly we need this because devices shipped with 1v88 not 1v89 :(
  if ("string"==typeof c &&
      c.length==4)
    return "0x"+c;
  return JSON.stringify(c);
}

function splitCharacteristic(char) {
  var c = char.split(",");
  return [formatCharacteristic(c[0]), formatCharacteristic(c[1])];
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
  var code = Blockly.JavaScript.statementToCode(this, 'DO') || "";
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
  var code = Blockly.JavaScript.statementToCode(this, 'DO') || "";
  return "NRF.on('disconnect', function() {\n"+code+"});\n";
};
// ----------------------------------------------------------
Blockly.Blocks.ble_advertise = {
  category: 'BLE',
  init: function() {
    this.appendValueInput('VAL')
      .setCheck(['String','Number','Boolean']).appendField('[BLE] Advertise');;
    bleStatement(this, "Advertise on Espruino's manufacturer data");
  }
};
Blockly.JavaScript.ble_advertise = function() {
  var data = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || undefined;
  return "NRF.setAdvertising({},{manufacturer: 0x0590, manufacturerData:"+data+"});\n";
};
// ----------------------------------------------------------
Blockly.Blocks.ble_on_advertise = {
  category: 'BLE',
  init: function() {
    this.appendDummyInput().appendField('[BLE] On Advertising');
    this.appendStatementInput('DO').appendField('do');
    bleStatement(this, "When an advertisement with Espruino's manufacturer data is detected");
  }
};
Blockly.JavaScript.ble_on_advertise = function() {
  var data = Blockly.JavaScript.valueToCode(this, 'DATA', Blockly.JavaScript.ORDER_ASSIGNMENT) || undefined;
  var code = Blockly.JavaScript.statementToCode(this, 'DO') || "";
  return "NRF.setScan(function(dev) {var ble_value=dev.manufacturerData;"+code+"}, { filters: [{ manufacturerData:{0x0590:{}} }] });\n";
};
// ----------------------------------------------------------
Blockly.Blocks.ble_uart_write = {
  category: 'BLE',
  init: function() {
    this.appendValueInput('VAL').setCheck(['Number','Boolean','String']).appendField('[BLE] Send');
    this.appendValueInput('DEV').setCheck(['BLEDevice']).appendField('to UART on');
    this.appendStatementInput('DO').appendField('then');
    bleStatement(this, 'Sends data to the UART on a Bluetooth device - adds a newline');
  }
};
Blockly.JavaScript.ble_uart_write = function() {
  var dev = Blockly.JavaScript.valueToCode(this, 'DEV', Blockly.JavaScript.ORDER_ASSIGNMENT) || "Promise.reject()";
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT)+'+"\\n"';
  var code = Blockly.JavaScript.statementToCode(this, 'DO') || "";
  if (!dev) return "";
  return `(function(){
  var gatt;
  var text = ${val};
  ${dev}.then(function(g) {
    gatt = g;
    return g.getPrimaryService("6e400001-b5a3-f393-e0a9-e50e24dcca9e");
  }).then(function(s) {
    return s.getCharacteristic("6e400002-b5a3-f393-e0a9-e50e24dcca9e");
  }).then(function(c) {
    function sender(resolve, reject) {
      if (text.length) {
        var d = text.substr(0,20);
        text = text.substr(20);
        c.writeValue(d).then(function() {
          sender(resolve, reject);
        },reject);
      } else  {
        resolve();
      }
    }
    return new Promise(sender);
  }).then(function() {
    return gatt.disconnect();
  }).then(function() {
    ${code}
  });
})();`;
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
  return [this.getFieldValue('SERV')+","+this.getFieldValue('CHAR'), Blockly.JavaScript.ORDER_ATOMIC];
};

// ----------------------------------------------------------

Blockly.Blocks.ble_characteristic_dropdown = {
  category: 'BLE',
  init: function() {
    this.appendDummyInput()
        .appendField('Characteristic ')
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
      this.appendValueInput('VAL').setCheck(['Number','Boolean','String']).appendField('to');
      this.appendStatementInput('DO').appendField('then');
    bleStatement(this, 'Sets a value on a BLE device');
  }
};
Blockly.JavaScript.ble_setchar = function() {
  var char = Blockly.JavaScript.valueToCode(this, 'CHAR', Blockly.JavaScript.ORDER_ASSIGNMENT);
  var dev = Blockly.JavaScript.valueToCode(this, 'DEV', Blockly.JavaScript.ORDER_ASSIGNMENT) || "Promise.reject()";
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var code = Blockly.JavaScript.statementToCode(this, 'DO') || "";
  if (!dev || !char) return "";
  char = splitCharacteristic(char);
  return `(function() {
  var gatt;
  ${dev}.then(function(g) {
    gatt = g;
    return gatt.getPrimaryService(${char[0]});
  }).then(function(service) {
    return service.getCharacteristic((${char[1]});
  }).then(function(characteristic) {
    characteristic.writeValue((${val});
  }).then(function() {
    return gatt.disconnect();
  }).then(function() {
    ${code}
  });
})();`;
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
  var dev = Blockly.JavaScript.valueToCode(this, 'DEV', Blockly.JavaScript.ORDER_ASSIGNMENT) || "Promise.reject()";
  var code = Blockly.JavaScript.statementToCode(this, 'DO') || "";
  if (!dev || !char) return "";
  char = splitCharacteristic(char);
  return `(function() {
  var gatt;
  ${dev}.then(function(g) {
    gatt = g;
    return gatt.getPrimaryService(${char[0]});
  }).then(function(service) {
    return service.getCharacteristic((${char[1]});
  }).then(function(characteristic) {
    return characteristic.readValue();\n"+
  }).then(function(value) {
    ble_value = value;
    return gatt.disconnect();
  }).then(function() {
    ${code}
  });
})();`;
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
  char = splitCharacteristic(char);
  var service = {};
  service[char[0]] = {};
  service[char[0]][char[1]] = {
    readable : true,
    notify : true
  };
  bleUpdateServices(service);
  return "NRF.updateServices({\n"+
"  "+char[0]+" : {\n"+
"    "+char[1]+" : {\n"+
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
  var code = Blockly.JavaScript.statementToCode(this, 'DO') || "";
  if (!char) return "";
  char = splitCharacteristic(char);

  var callbackVar = Blockly.JavaScript.variableDB_.getDistinctName(
      'onWriteCallback', Blockly.Variables.NAME_TYPE);

  var service = {};
  service[char[0]] = {};
  service[char[0]][char[1]] = {
    readable : true,
    writable : true,
    notify : true,
    onWrite : callbackVar // this gets replaced by bleUpdateServices
  };
  bleUpdateServices(service);
  return "function "+callbackVar+"() {\n  "+code+"\n}";
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
  return ["ble_value", Blockly.JavaScript.ORDER_ATOMIC];
};
