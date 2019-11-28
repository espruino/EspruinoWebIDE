/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Blockly blocks for Espruino Menus (E.show*)
 ------------------------------------------------------------------
**/

var MENU_COL = 10;


function menuStatement(blk, comment) {
  blk.setPreviousStatement(true);
  blk.setNextStatement(true);
  blk.setColour(MENU_COL);
  blk.setInputsInline(true);
  blk.setTooltip(comment);
}
function menuInput(blk, comment) {
  blk.setOutput(true, 'Number');
  blk.setColour(MENU_COL);
  blk.setInputsInline(true);
  blk.setTooltip(comment);
}

// ----------------------------------------------------------
Blockly.Blocks.menu_message = {
  category: 'Graphics',
  init: function() {
    this.appendValueInput('TEXT')
        .setCheck(['String','Number','Boolean'])
        .appendField('Show')
    this.appendValueInput('TITLE')
        .setCheck(['String','Number','Boolean'])
        .appendField('with title');
    menuStatement(this, 'Show a message on the screen');
  }
};
Blockly.JavaScript.menu_message = function() {
  var text = Blockly.JavaScript.valueToCode(this, 'TEXT', Blockly.JavaScript.ORDER_ASSIGNMENT) || '""';
  var title = Blockly.JavaScript.valueToCode(this, 'TITLE', Blockly.JavaScript.ORDER_ASSIGNMENT) || '""';
  return `E.showMessage(""+${text},""+${title});\n`;
};
// ----------------------------------------------------------
Blockly.Blocks.menu_alert = {
  category: 'Espruino',
  init: function() {
    this.appendValueInput('TEXT')
        .setCheck(['String','Number','Boolean'])
        .appendField('Show');
    this.appendValueInput('TITLE')
        .setCheck(['String','Number','Boolean'])
        .appendField('with title');
    this.appendStatementInput('DO')
         .appendField('when ok');
    menuStatement(this, 'Show a message on the screen and wait');
  }
};
Blockly.JavaScript.menu_alert = function() {
  var text = Blockly.JavaScript.valueToCode(this, 'TEXT', Blockly.JavaScript.ORDER_ASSIGNMENT) || '""';
  var title = Blockly.JavaScript.valueToCode(this, 'TITLE', Blockly.JavaScript.ORDER_ASSIGNMENT) || '""';
  var branch = Blockly.JavaScript.statementToCode(this, 'DO');
  return `E.showAlert(""+${text},""+${title}).then(function() {\n${branch}});\n`;
};
// ----------------------------------------------------------
Blockly.Blocks.menu_prompt = {
  category: 'Espruino',
  init: function() {
    this.appendValueInput('TEXT')
        .setCheck(['String','Number','Boolean'])
        .appendField('Ask');
    this.appendValueInput('TITLE')
        .setCheck(['String','Number','Boolean'])
        .appendField('with title');
    this.appendStatementInput('YES')
         .appendField('if yes');
    this.appendStatementInput('NO')
         .appendField('if no');
    menuStatement(this, 'Show a message on the screen and wait');
  }
};
Blockly.JavaScript.menu_prompt = function() {
  var text = Blockly.JavaScript.valueToCode(this, 'TEXT', Blockly.JavaScript.ORDER_ASSIGNMENT) || '""';
  var title = Blockly.JavaScript.valueToCode(this, 'TITLE', Blockly.JavaScript.ORDER_ASSIGNMENT) || '""';
  var yes = Blockly.JavaScript.statementToCode(this, 'YES') || '{}';
  var no = Blockly.JavaScript.statementToCode(this, 'NO') || '{}';
  return `E.showPrompt(""+${text},{title:""+${title}}).then(function(a) {\nif (a) { ${yes} } else { ${no} }});\n`;
};
