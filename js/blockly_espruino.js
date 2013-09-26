var ESPRUINO_COL = 190;

var PORTS = ["A","B","C"];
var PINS = [
      ["LED1", 'LED1'],
      ["LED2", 'LED2'],
      ["LED3", 'LED3'],
      ["BTN1", 'BTN1']];
for (var p in PORTS)
  for (var i=0;i<16;i++) {
    var pinname = PORTS[p]+i;
    PINS.push([pinname,pinname]);
  }

Blockly.Language.espruino_timeout = {
  category: 'Espruino',
  init: function() {
      this.appendValueInput('SECONDS')
          .setCheck('Number')
          .appendTitle('wait');
      this.appendDummyInput()
          .appendTitle("seconds");
      this.appendStatementInput('DO')
           .appendTitle('do');

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(ESPRUINO_COL);
    this.setInputsInline(true);
    this.setTooltip('Waits for a certain period before running code');
  }
};
Blockly.Language.espruino_interval = {
  category: 'Espruino',
  init: function() {
      this.appendValueInput('SECONDS')
          .setCheck('Number')
          .appendTitle('every');
      this.appendDummyInput()
          .appendTitle("seconds");
      this.appendStatementInput('DO')
           .appendTitle('do');

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(ESPRUINO_COL);
    this.setInputsInline(true);
    this.setTooltip('Runs code repeatedly, every so many seconds');
  }
};
Blockly.Language.espruino_pin = {
//  category: 'Espruino',
  init: function() {
    this.setColour(ESPRUINO_COL);
    this.setOutput(true, 'Pin');
    this.appendDummyInput()
         .appendTitle(new Blockly.FieldDropdown(this.PINS), 'PIN');
    this.setTooltip('The Name of a Pin');
  },
  PINS: PINS,
};
   

Blockly.Language.espruino_watch = {
  category: 'Espruino',
  init: function() {
      this.appendValueInput('PIN')
          .setCheck('Pin')
          .appendTitle('watch');
      this.appendDummyInput()
           .appendTitle(new Blockly.FieldDropdown(this.EDGES), 'EDGE').appendTitle('edge');;
      this.appendStatementInput('DO')
           .appendTitle('do');

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(ESPRUINO_COL);
    this.setInputsInline(true);
    this.setTooltip('Runs code when an input changes');
  },
EDGES: [
["both", 'both'],
["rising", 'rising'],
["falling", 'falling']]
};


Blockly.Language.espruino_getTime = {
    category: 'Espruino',
    init: function() {
      this.appendDummyInput().appendTitle('Time');
      this.setOutput(true, 'Number');
      this.setColour(230/*Number*/);
      this.setInputsInline(true);
      this.setTooltip('Read the current time in seconds');
    }
  };


Blockly.Language.espruino_digitalWrite = {
  category: 'Espruino',
  init: function() {
      this.appendValueInput('PIN')
          .setCheck('Pin')
          .appendTitle('digitalWrite Pin');
      this.appendValueInput('VAL')
          .setCheck(['Number','Boolean'])
          .appendTitle('Value');

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(ESPRUINO_COL);
    this.setInputsInline(true);
    this.setTooltip('Writes a Digital Value to a Pin');
  }
};
Blockly.Language.espruino_digitalRead = {
  category: 'Espruino',
  init: function() {
      this.appendValueInput('PIN')
          .setCheck('Pin')
          .appendTitle('digitalRead Pin');

    this.setOutput(true, 'Boolean');
    this.setColour(ESPRUINO_COL);
    this.setInputsInline(true);
    this.setTooltip('Read a Digital Value from a Pin');
  }
};

Blockly.Language.espruino_analogWrite = {
    category: 'Espruino',
    init: function() {
        this.appendValueInput('PIN')
            .setCheck('Pin')
            .appendTitle('analogWrite Pin');
        this.appendValueInput('VAL')
            .setCheck(['Number','Boolean'])
            .appendTitle('Value');

      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(ESPRUINO_COL);
      this.setInputsInline(true);
      this.setTooltip('Writes an Analog Value to a Pin');
    }
  };
Blockly.Language.espruino_analogRead = {
    category: 'Espruino',
    init: function() {
        this.appendValueInput('PIN')
            .setCheck('Pin')
            .appendTitle('analogRead Pin');

      this.setOutput(true, 'Number');
      this.setColour(ESPRUINO_COL);
      this.setInputsInline(true);
      this.setTooltip('Read an Analog Value from a Pin');
    }
  };
// -----------------------------------------------------------------------------------

Blockly.JavaScript.text_print = function() {
  var argument0 = Blockly.JavaScript.valueToCode(this, 'TEXT',
      Blockly.JavaScript.ORDER_NONE) || '\'\'';
  return 'print(' + argument0 + ');\n';
};
Blockly.JavaScript.espruino_timeout = function() {
  var seconds = Blockly.JavaScript.valueToCode(this, 'SECONDS',
      Blockly.JavaScript.ORDER_ASSIGNMENT) || '1';
  var branch = Blockly.JavaScript.statementToCode(this, 'DO');
  return "setTimeout(function() {\n"+branch+" }, "+seconds+"*1000.0);\n";
};
Blockly.JavaScript.espruino_getTime = function() {
  return ["getTime()\n", Blockly.JavaScript.ORDER_ATOMIC];
};
Blockly.JavaScript.espruino_interval = function() {
  var seconds = Blockly.JavaScript.valueToCode(this, 'SECONDS',
      Blockly.JavaScript.ORDER_ASSIGNMENT) || '1';
  var branch = Blockly.JavaScript.statementToCode(this, 'DO');
  return "setInterval(function() {\n"+branch+" }, "+seconds+"*1000.0);\n";
};
Blockly.JavaScript.espruino_pin = function() {
  var code = this.getTitleValue('PIN');
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};
Blockly.JavaScript.espruino_watch = function() {
  var pin = Blockly.JavaScript.valueToCode(this, 'PIN', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var edge = this.getTitleValue('EDGE');
  var branch = Blockly.JavaScript.statementToCode(this, 'DO');
  return "setWatch(function() {\n"+branch+" }, "+pin+", { repeat : true, edge : '"+edge+"'});\n";
};
Blockly.JavaScript.espruino_digitalWrite = function() {
  var pin = Blockly.JavaScript.valueToCode(this, 'PIN', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "digitalWrite("+pin+", "+val+");\n";
};
Blockly.JavaScript.espruino_digitalRead = function() {
  var pin = Blockly.JavaScript.valueToCode(this, 'PIN', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return ["digitalRead("+pin+")\n", Blockly.JavaScript.ORDER_ATOMIC];
};
Blockly.JavaScript.espruino_analogWrite = function() {
  var pin = Blockly.JavaScript.valueToCode(this, 'PIN', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var val = Blockly.JavaScript.valueToCode(this, 'VAL', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return "analogWrite("+pin+", "+val+");\n";
};
Blockly.JavaScript.espruino_analogRead = function() {
  var pin = Blockly.JavaScript.valueToCode(this, 'PIN', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return ["analogRead("+pin+")\n", Blockly.JavaScript.ORDER_ATOMIC];
};

// -----------------------------------------------------------------------------------

onload = function() {
  Blockly.inject(document.body,{path: '', toolbox: document.getElementById('toolbox')});
  Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, document.getElementById('blocklyInitial')); 
  window.parent.Blockly = Blockly;
};

