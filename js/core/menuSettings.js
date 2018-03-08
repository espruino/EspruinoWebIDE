/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Settings Menu
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  var currentSection;

  function init() {
    Espruino.Core.App.addIcon({
      id: "settings",
      icon: "settings",
      title : "Settings",
      order: -100,
      area: {
        name: "toolbar",
        position: "right"
      },
      click: function() {
        createSettingsWindow();
      }
    });
  }

  function createSettingsWindow(initialSection) {
    if (initialSection==undefined)
      initialSection = "About";
    // Get sections
    var sections = Espruino.Core.Config.getSections();
    // Write list of sections
    var html =
      '<div class="settings">'+
        '<div class="sections">';
    for (var i in sections) {
      var sectionHasEntries = sections[i].getHTML!==undefined;
      var sectionName = sections[i].name;
      var configItems = Espruino.Core.Config.data;
      for (var configName in configItems) {
        var configItem = configItems[configName];
        if (configItem.section == sectionName) {
          sectionHasEntries = true;
          break;
        }
      }
      if (sectionHasEntries || sections[i].alwaysShow)
        html += '<a name="'+sectionName+'" title="'+ sections[i].description +'"><div class="icon-forward sml"></div><span>'+sectionName+'</span></a>';
    }
    html +=
        '</div>'+
        '<div class="currentsection">'+
        '</div>'+
      '</div>';
    // Create the window
    Espruino.Core.App.openPopup({
      title: "Settings",
      contents: html,
      position: "stretch",
    });
    // Handle section changes
    $(".settings .sections a").click(function() {
      showSettingsSection($(this).attr("name"));
    });
    // Show initial section
    showSettingsSection(initialSection);
  }

  function showSettingsSection(sectionName) {
    currentSection = sectionName;
    $(".settings .sections a").removeClass("current");
    getSettingsSection(sectionName, function(data) {
      $(".settings .currentsection").html(data);
      $(".settings .sections a[name='"+sectionName+"']").addClass("current");
      $(".tour_link").click(function(e) {
        e.preventDefault();
        Espruino.Core.App.closePopup();
        Espruino.Plugins.Tour.runTour("/data/tours/"+$(this).attr("tour_name"));
      });
    });
  }

  function getSettingsSection(sectionName, callback) {
    var section = Espruino.Core.Config.getSection(sectionName);
    if (section===undefined) {
      console.warn("No section named "+sectionName+" found");
      callback("");
      return;
    }

    var html = "<h1>"+sectionName+"</h1>";
    if (section.descriptionHTML!==undefined)
      html += "<p>"+section.descriptionHTML+"<p>";
    if (section.description!==undefined)
      html += "<p>"+Espruino.Core.Utils.escapeHTML(section.description, false).replace("\n","</p><p>") +"<p>";
    if (section.tours!==undefined) {
      html += "<p>See the ";
      var tours = [];
      for (var tourName in section.tours)
        tours.push('<a href="#" class="tour_link" tour_name="'+section.tours[tourName]+'">'+tourName+'</a>');

      if (tours.length==1)
        html += tours[0];
      else
        html += tours.slice(0,-1).join(", ") + " and "+tours[tours.length-1];
      html += " for more information.</p>";
    }

    var configItems = Espruino.Core.Config.data;
    for (var configName in configItems) {
      var configItem = configItems[configName];
      if (configItem.section == sectionName) {
        html += getHtmlForConfigItem(configName, configItem);
      }
    }

    if (section.getHTML!==undefined) {
      section.getHTML(function (data) {
        callback(html + data);
      });
    } else {
      callback(html);
    }

   $(".settings .currentsection input,select").change(function() {
     // First, check for multi_select
     var configGroup = $(this).attr("configGroup");
     if (configGroup && configItems[configGroup] !== undefined) {
       var checked = [];
       $(this).parent().children().each(function() {
         if ($(this).is(':checked')) checked.push($(this).val());
       });
      Espruino.Config.set(configGroup, "|"+checked.join("|")+"|");
      return;
     }
     // Then simple one-off checkboxes
     var configName = $(this).attr("name");
     if (configName && configItems[configName] !== undefined) {
       if (configItems[configName].type == "boolean")
         Espruino.Config.set(configName, $(this).is(':checked'));
       else
         Espruino.Config.set(configName, $(this).val());
       console.log("Config."+configName+" => "+Espruino.Config[configName]);
     } else
       console.warn("Config named '"+configName+"' not found");
   });
   $(".settings .currentsection button").click(function() {
     var key = $(this).attr("name");
     if (Espruino.Core.Config.data[key] !== undefined &&
         Espruino.Core.Config.data[key].onClick !== undefined)
       Espruino.Core.Config.data[key].onClick();
   });
  }

  function getHtmlForConfigItem(configName, config) {
    var value = Espruino.Config[configName];
    var html =
      '<h3 style="clear:both">'+Espruino.Core.Utils.escapeHTML(config.name)+'</h3>';
    var desc = "";
    if (config.descriptionHTML!==undefined)
      desc += "<p>"+config.descriptionHTML+"<p>";
    if (config.getDescriptionHTML!==undefined)
      html += "<p>"+config.getDescriptionHTML()+"<p>";
    if (config.description!==undefined)
      desc += '<p>'+Espruino.Core.Utils.escapeHTML(config.description, false).replace("\n","</p><p>")+'</p>';
    // type : "int"/"boolean"/"string"/{ value1:niceName, value2:niceName },
    if (config.type == "none" || config.type===undefined) {
      html += desc;
    } else if (config.type == "boolean") {
      html += '<input name="'+configName+'" type="checkbox" style="float: right;" '+(value?"checked":"")+'/>';
      html += desc;
    } else if (config.type == "string") {
      html += desc;
      html += '<input name="'+configName+'" type="text" size="80" value="'+Espruino.Core.Utils.escapeHTML(value)+'"/>';
    } else if ((typeof config.type) == "object") {
      if (config.type.multi_select==true) {
        html += '<div name="'+configName+'" style="float: right;">';
        for (var key in config.type) {
          if (key=="multi_select") continue;
          var checked = value.indexOf("|"+key+"|")>=0;
          var id = configName+"_"+key;
          html += '<input type="checkbox" id="'+id+'" configGroup="'+configName+'" name="'+id+'" value="'+key+'" '+(checked?"checked":"")+'>'+
                  '<label for="'+id+'">'+Espruino.Core.Utils.escapeHTML(config.type[key])+'</label><br/>';
        }
        html += '</div>';
      } else {
        html += '<select name="'+configName+'" style="float: right;">';
        for (var key in config.type)
          html += '<option value="'+Espruino.Core.Utils.escapeHTML(key)+'" '+(key==value?"selected":"")+'>'+
                    Espruino.Core.Utils.escapeHTML(config.type[key])+
                  '</option>';
        html += '</select>';
      }
      html += desc;
    } else if (config.type == "button") {
      var label = config.label || "Go";
      html += '<button name="'+configName+'" style="float: right;" '+(value?"checked":"")+'>'+label+'</button>';
      html += desc;
    } else {
      console.warn("Unknown config type '"+config.type+"' for Config."+configName);
    }
    return html;
  }

  function refresh() {
    showSettingsSection(currentSection);
  }

  Espruino.Core.MenuSettings = {
    init : init,
    show : createSettingsWindow,
    refresh : refresh,
  };
}());
