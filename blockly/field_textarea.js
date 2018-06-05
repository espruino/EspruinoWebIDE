/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Modified by Gordon Williams (gw@pur3.co.uk) for Espruino
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Text input field.
 * @author primary.edw@gmail.com (Andrew Mee) based on work in field_textinput by fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.FieldTextArea');

goog.require('Blockly.Field');
goog.require('Blockly.Msg');
goog.require('goog.asserts');
goog.require('goog.userAgent');


/**
 * Class for an editable text field.
 * @param {string} text The initial content of the field.
 * @param {Function} opt_changeHandler An optional function that is called
 *     to validate any constraints on what the user entered.  Takes the new
 *     text as an argument and returns either the accepted text, a replacement
 *     text, or null to abort the change.
 * @extends {Blockly.Field}
 * @constructor
 */
Blockly.FieldTextArea = function(text, opt_changeHandler) {
  Blockly.FieldTextArea.superClass_.constructor.call(this, text);

  this.changeHandler_ = opt_changeHandler;
};
goog.inherits(Blockly.FieldTextArea, Blockly.FieldTextInput);

/**
 * Clone this FieldTextArea.
 * @return {!Blockly.FieldTextArea} The result of calling the constructor again
 *   with the current values of the arguments used during construction.
 */
Blockly.FieldTextArea.prototype.clone = function() {
  return new Blockly.FieldTextArea(this.getText(), this.changeHandler_);
};

/**
 * Mouse cursor style when over the hotspot that initiates the editor.
 */
Blockly.FieldTextArea.prototype.CURSOR = 'text';

/**
 * Close the input widget if this input is being deleted.
 */
Blockly.FieldTextArea.prototype.dispose = function() {
  Blockly.WidgetDiv.hideIfOwner(this);
  Blockly.FieldTextArea.superClass_.dispose.call(this);
};

/**
 * Get the text from this field as displayed on screen.  May differ from getText
 * due to ellipsis, and other formatting.
 * @return {string} Currently displayed text.
 * @private
 */
Blockly.FieldTextArea.prototype.getDisplayText_ = function() {
  var text = this.text_;
  if (!text) {
    // Prevent the field from disappearing if empty.
    return Blockly.Field.NBSP;
  }
  text = text.split("\n").map(function(text) {
    if (text.length > this.maxDisplayLength) {
      // Truncate displayed string and add an ellipsis ('...').
      text = text.substring(0, this.maxDisplayLength - 2) + '\u2026';
    }
    // Replace whitespace with non-breaking spaces so the text doesn't collapse - keep newline.
    text = text.replace(/\s/g, Blockly.Field.NBSP);
    return text;
  }.bind(this)).join("\n");
  if (this.sourceBlock_.RTL) {
    // The SVG is LTR, force text to be RTL.
    text += '\u200F';
  }
  return text;
};

/**
 * Draws the border with the correct width.
 * Saves the computed width in a property.
 * @private
 */
Blockly.FieldTextArea.prototype.render_ = function() {
  if (!this.visible_) {
    this.size_.width = 0;
    return;
  }

  // Replace the text.
  var textElement = this.textElement_;
  goog.dom.removeChildren(/** @type {!Element} */ (textElement));
  var txt = this.getDisplayText_();
  var y = 0;
  var yoffset = 14; // 12.5 is hard-coded in Blockly.Field
  var txtLines = txt.split("\n");
  txtLines.forEach(function(t) {
    Blockly.utils.createSvgElement('tspan', {x:0,y:y+yoffset}, textElement)
			  .appendChild(document.createTextNode(t));
    y += 20;
  });
  if (txtLines.length==0) y+=20;

  // set up widths
  this.size_.width = this.textElement_.getBBox().width + 5;
  this.size_.height= y + (Blockly.BlockSvg.SEP_SPACE_Y+5) ;

  if (this.borderRect_) {
    this.borderRect_.setAttribute('width',
           this.size_.width + Blockly.BlockSvg.SEP_SPACE_X);
   	this.borderRect_.setAttribute('height',
           this.size_.height - (Blockly.BlockSvg.SEP_SPACE_Y+5));
  }
};


/**
 * Create and show a text input editor that sits directly over the text input.
 * @param {boolean} quietInput True if editor should be created without
 *     focus.
 * @private
 */
Blockly.FieldTextArea.prototype.showInlineEditor_ = function(quietInput) {
  Blockly.WidgetDiv.show(this, this.sourceBlock_.RTL, this.widgetDispose_());
  var div = Blockly.WidgetDiv.DIV;
  // Create the input.
  var htmlInput =
      goog.dom.createDom("TEXTAREA", 'blocklyHtmlInput');
  htmlInput.setAttribute('spellcheck', this.spellcheck_);
  var fontSize =
      (Blockly.FieldTextInput.FONTSIZE * this.workspace_.scale) + 'pt';
  div.style.fontSize = fontSize;
  htmlInput.style.fontSize = fontSize;
  htmlInput.style.marginTop="2px"; // hack so we don't have to change resizeEditor_

  Blockly.FieldTextInput.htmlInput_ = htmlInput;
  div.appendChild(htmlInput);

  htmlInput.value = htmlInput.defaultValue = this.text_;
  htmlInput.oldValue_ = null;
  this.validate_();
  this.resizeEditor_();
  if (!quietInput) {
    htmlInput.focus();
    htmlInput.select();
  }

  this.bindEvents_(htmlInput);
};

/**
 * Handle key down to the editor.
 * @param {!Event} e Keyboard event.
 * @private
 */
Blockly.FieldTextArea.prototype.onHtmlInputKeyDown_ = function(e) {
  var enterKey = 13
  if (e.keyCode == enterKey) return;
  Blockly.FieldTextInput.prototype.onHtmlInputKeyDown_.call(this, e);
};
