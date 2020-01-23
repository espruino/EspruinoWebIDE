/**
 Copyright 2016 Gordon Williams (gw@pur3.co.uk),
                Victor Nakoryakov (victor@amperka.ru)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Settings profile (mass options update) plugin
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  function init() {
  }

  function updateFromJson(obj) {
    if (typeof obj === 'string') {
      obj = JSON.parse(obj);
    }

    confirmApply(obj, function() {
      Object.keys(obj).forEach(function(key) {
        Espruino.Config.set(key, obj[key]);
      });
    });
  }

  function confirmApply(obj, confirmCallback) {
    var $content = $('<div></div>');
    var $wrapper = $('<div class="settingsProfile__popup"></div>').appendTo($content);
    $wrapper.append('Following settings are about to be applied:');

    var $table = $([
      '<table>',
        '<thead>',
          '<tr>',
            '<th>Key</th>',
            '<th>Value</th>',
          '</tr>',
        '</thead>',
        '<tbody>',
        '</tbody>',
      '</table>'
    ].join('')).appendTo($wrapper);

    var $tbody = $('tbody', $table);

    var isAltered = false;
    Object.keys(obj).forEach(function(key) {
      if (Espruino.Config[key]!=obj[key])
        isAltered = true;
      $([
        '<tr>',
          '<td>', key, '</td>',
          '<td>', obj[key], '</td>',
        '</tr>'
      ].join('')).appendTo($tbody);
    });

    // Nothing has changed - don't bother prompting the user.
    if (!isAltered) return;

    var popup = Espruino.Core.App.openPopup({
      title: "Confirm setting update...",
      contents: $content.html(),
      position: "center",
      buttons : [{ name:"Ok", callback : function() {
        popup.close();
        confirmCallback();
      }}]
    });
  }

  Espruino.Plugins.SettingsProfile = {
    init : init,
    updateFromJson: updateFromJson
  };
}());
