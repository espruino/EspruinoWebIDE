/**
 * Macro Buttons Plugin for Espruino Web IDE
 *
 * Adds a single "Macros" icon to the terminal sidebar. Hover to
 * see a menu of macros for quick execution, or click the icon to
 * open a popup for managing macros.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
"use strict";
(function() {

  var MAX_MACROS = 10;
  var icon;

  var defaults = [
    { name: "Load", script: "load();\n" }
  ];

  function getMacros() {
    var raw = Espruino.Config.MACRO_SCRIPTS;
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0)
          return parsed;
      } catch(e) {}
    }
    return defaults.map(function(d) {
      return { name: d.name, script: d.script };
    });
  }

  function setMacros(macros) {
    Espruino.Config.set("MACRO_SCRIPTS", JSON.stringify(macros));
  }

  function sendScript(script) {
    if (!script) return;
    var cmd = script.replace(/\r\n/g, "\n");
    if (cmd[cmd.length - 1] !== "\n") cmd += "\n";
    Espruino.Core.MenuPortSelector.ensureConnected(function() {
      Espruino.Core.Serial.write(cmd);
    });
  }

  function buildMenuItems() {
    var macros = getMacros();
    return macros.map(function(m, idx) {
      return {
        id: "macro-" + idx,
        icon: "lightning",
        title: m.name,
        order: idx,
        click: function() {
          sendScript(m.script);
        }
      };
    });
  }

  function showConfigPopup(index) {
    var macros = getMacros();
    var isNew = (index === undefined);
    if (isNew) {
      if (macros.length >= MAX_MACROS) {
        Espruino.Core.Notifications.error("Maximum of " + MAX_MACROS + " macros reached.");
        return;
      }
      index = macros.length;
      macros.push({ name: "Macro " + (index + 1), script: "" });
    }
    var m = macros[index];

    var contents =
      '<div style="padding:10px;">' +
        '<label style="display:block;margin-bottom:4px;font-weight:bold;">Name:</label>' +
        '<input id="macro-cfg-name" type="text" maxlength="15" value="" size="30" style="border:2px solid #ccc;margin-bottom:10px;" />' +
        '<label style="display:block;margin-bottom:4px;font-weight:bold;">Script (sent to Espruino on click):</label>' +
        '<textarea id="macro-cfg-script" rows="6" cols="30" style="border:2px solid #ccc;font-family:monospace;font-size:13px;resize:vertical;"></textarea>' +
      '</div>' +
      '<style>.guiders_buttons_container { height: auto !important; display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; } .guiders_buttons_container .guiders_button { padding: 6px 12px; font-size: 13px; }</style>';

    var buttons = [
      { name: "Save", callback: function() {
        var nameInput = document.getElementById("macro-cfg-name");
        var scriptInput = document.getElementById("macro-cfg-script");
        var name = (nameInput.value || ("Macro " + (index + 1))).substring(0, 15);
        macros[index].name = name;
        macros[index].script = scriptInput.value;
        setMacros(macros);
        popup.close();
        recreateIcon();
        showMacroList();
      }},
      { name: "Cancel", callback: function() {
        popup.close();
      }}
    ];

    if (!isNew) {
      buttons.push({ name: "Delete", callback: function() {
        macros.splice(index, 1);
        setMacros(macros);
        popup.close();
        recreateIcon();
        showMacroList();
      }});
    }

    var popup = Espruino.Core.App.openPopup({
      title: isNew ? "New Macro" : "Configure Macro: " + m.name,
      contents: contents,
      position: "center",
      buttons: buttons
    });

    var nameInput = document.getElementById("macro-cfg-name");
    var scriptInput = document.getElementById("macro-cfg-script");
    nameInput.value = m.name;
    scriptInput.value = m.script;
    nameInput.focus();
  }

  function showMacroList() {
    var macros = getMacros();

    var listItems = macros.map(function(m, idx) {
      return {
        title: Espruino.Core.Utils.escapeHTML(m.name),
        right: [
          { title: "Run", icon: "icon-deploy",
            callback: function() {
              popup.close();
              sendScript(m.script);
            }
          },
          { title: "Edit", icon: "icon-settings",
            callback: function() {
              popup.close();
              showConfigPopup(idx);
            }
          }
        ]
      };
    });

    listItems.push({
      icon: "icon-plus",
      title: "Add Macro...",
      callback: function() {
        popup.close();
        showConfigPopup(undefined);
      }
    });

    var popup = Espruino.Core.App.openPopup({
      title: "Macros",
      contents: Espruino.Core.HTML.domList(listItems),
      position: "center"
    });
  }

  function init() {
    Espruino.Core.Config.add("MACRO_ENABLED", {
      section: "General",
      name: "Enable Macro Buttons",
      subSection : "Editor UI",
      description: "Show a Macros icon in the terminal sidebar with quick-send script buttons",
      type: "boolean",
      defaultValue: false,
      onChange: function(newValue) {
        if (newValue) {
          createIcon();
        } else {
          removeIcon();
        }
      }
    });

    Espruino.Core.Config.add("MACRO_SCRIPTS", {
      section: "General",
      name: "Macro Scripts (JSON)",
      subSection : "Editor UI",
      description: "JSON array of macro objects with name and script fields. Edited via the Macros popup.",
      type: "string",
      defaultValue: JSON.stringify(defaults)
    });

    if (Espruino.Config.MACRO_ENABLED)
      createIcon();
  }

  function createIcon() {
    if (icon) return;
    icon = Espruino.Core.App.addIcon({
      id: "macroBtn",
      icon: "lightning",
      title: "Macros",
      order: -90,
      area: { name: "terminal", position: "top" },
      click: function() {
        showMacroList();
      },
      menu: buildMenuItems()
    });
  }

  function removeIcon() {
    if (icon) {
      icon.remove();
      icon = undefined;
    }
  }

  function recreateIcon() {
    if (!icon) return;
    removeIcon();
    createIcon();
  }

  Espruino.Plugins.MacroButtons = {
    init: init
  };
}());
