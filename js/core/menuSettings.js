/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  An Example Plugin
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
    Espruino.Core.Layout.addIcon({ name: "settings", title : "Settings", order: 0, area: "right" }, createSettingsWindow);
  }
  
  function createSettingsWindow() {
    // Get sections
    var sections = Espruino.Core.Config.getSections();
    sections.unshift("About");
    // Write list of sections
    var html = 
      '<div class="settings">'+
        '<div class="sections">';   
    for (var i in sections)
      html+=
        '  <a name="'+sections[i]+'"><div class="icon-forward sml"></div><span>'+sections[i]+'</span></a>';
    html +=    
        '</div>'+
        '<div class="currentsection">'+
        '</div>'+
      '</div>';
    // Create the window
    Espruino.Core.Layout.addPopup(html, {
      title: "Settings",
      position: "stretch",
    });
    // Handle section changes
    $(".settings .sections a").click(function() {
      showSettingsSection($(this).attr("name"));
    });
    // Show initial section
    showSettingsSection("About");
  }
  
  function showSettingsSection(sectionName) {
    $(".settings .sections a").removeClass("current");
    getSettingsSection(sectionName, function(data) {
      $(".settings .currentsection").html(data);      
      $(".settings .sections a[name='"+sectionName+"']").addClass("current");
    });
  }
  
  function getSettingsSection(sectionName, callback) {
    if (sectionName == "About") {
      $.get("/data/settings_about.html", function(data) {
        callback(data);
        var html;
        if (Object.keys(Espruino.Core.Env.getBoardData()).length > 0)
          html = Espruino.Core.Utils.htmlTable(Espruino.Core.Env.getBoardData());
        else
          html = "<p>Unable to get board information</p>";
        $('.board_info').html( html );
      });
      return;
    }
    
    var html = "<h1>"+sectionName+"</h1>";
    var configItems = Espruino.Core.Config.data;
    for (var configName in configItems) {
      var configItem = configItems[configName];
      if (configItem.section == sectionName) {
        html += getHtmlForConfigItem(configName, configItem);
      }
    }
    // send the HTML
    callback(html);    
    // now we handle when stuff changes
    
   $(".settings .currentsection input,select").change(function() {
     var configName = $(this).attr("name");
     if (configItems[configName] !== undefined) {
       if (configItems[configName].type == "boolean")
         Espruino.Config.set(configName, $(this).is(':checked'));
       else
         Espruino.Config.set(configName, $(this).val());
       console.log("Config."+configName+" => "+Espruino.Config[configName]);
     } else
       console.warn("Config named '"+configName+"' not found");
   });
    
  }
  
  function getHtmlForConfigItem(configName, config) {
    var value = Espruino.Config[configName];
    var html = 
      '<h3>'+Espruino.Core.Utils.escapeHTML(config.name)+'</h3>';
    var desc =
      '<p>'+Espruino.Core.Utils.escapeHTML(config.description)+'</p>';
    // type : "int"/"boolean"/"string"/{ value1:niceName, value2:niceName },
    if (config.type == "boolean") {
      html += '<input name="'+configName+'" type="checkbox" style="float: right;" '+(value?"checked":"")+'/>';
      html += desc;
    } else if (config.type == "string") {
      html += desc;
      html += '<input name="'+configName+'" type="text" size="80" value="'+Espruino.Core.Utils.escapeHTML(value)+'"/>';
    } else if ((typeof config.type) == "object") {
      html += '<select name="'+configName+'" style="float: right;">';
      for (var key in config.type)
        html += '<option value="'+Espruino.Core.Utils.escapeHTML(key)+'" '+(key==value?"selected":"")+'>'+
                  Espruino.Core.Utils.escapeHTML(config.type[key])+
                '</option>';
      html += '</select>';
      html += desc;
    } else
      console.warn("Unknown config type '"+config.type+"' for Config."+configName);    
      
    return html;
  }
  
  Espruino.Core.MenuSettings = {
    init : init,
  };
}());