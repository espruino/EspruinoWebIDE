/*
 * The MIT License

Copyright (c) 2013 by Juergen Marsch

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
"use strict";
(function(){
  
  // <button class="options" style="position:absolute;right:4px;">Info / Options</button>
  
/* To use this from a JS file:

   Espruino.YourFile.anOption = false;
   Espruino.YourFile.someText = false;    

   Espruino.YourFile.initOptions = function() {
     Espruino.Options.optionBlocks.push({id:"#divOptionYourFile",htmlUrl:"data/Espruino_YourFile.html", onForm: function() { optional... });
     // onForm is run when the optionBlock has been appended to the options menu

     Espruino.Options.optionFields.push({id:".anOption",module:"YourFile",field:"anOption",type:"radio"});
     Espruino.Options.optionFields.push({id:".someText",module:"YourFile",object:optionalString,field:"someText",type:"text"});
     // if object specified, look in Espruino.YourFile.object.someText not Espruino.YourFile.someText 
     // note: also { onLoaded:function, onBlur:bool }
   }

  and in data/Options.json add a line to describe your options


  For debugging (in Chrome console):

  Reset to complete defaults:

  chrome.storage.local.set({EspruinoOptions:{}})

  See what's being stored:
  
  chrome.storage.local.get("EspruinoOptions",function (r) { console.log(r); })

*/

  Espruino.Options = {};
  var urlOptions = "data/options.html", defaultFileName = "EspruinoOptions";
  var optionFields = [];
  var optionBlocks = [];
  var maxWait = 5000;
  var divEspruino = "", divCredit = "", divButtons = "", headerObject = {};
  Espruino.Options.optionFields = optionFields;
  Espruino.Options.optionBlocks = optionBlocks;
  Espruino.Options.init = function(){
    $( ".options" ).button({ text: false, icons: { primary: "ui-icon-info" } }).click(openOptionsForm);
    for(var m in Espruino){
      if(Espruino[m].initOptions){ Espruino[m].initOptions();}
    }
    Espruino.Options.loadOptions(setStartMode);
    function setStartMode(){
      if(Espruino.General.startMode === "JS"){$("#divblockly").hide();$("#divcode").show();}
      else{$("#divcode").hide();$("#divblockly").show();}
      optionsOnLoaded();
    }
    $.get("data/Espruino.html",function(data){divEspruino = data;});
    $.get("data/Credit.html",function(data){divCredit = data;});
    $.get("data/Buttons.html",function(data){divButtons = data;});
    $.getJSON("data/Options.json",function(data){headerObject = data;});
  };
  function openOptionsForm(){
    var i,j,optionModules,data,om,activeFound = false;
    $("#optionsdiv").remove();
    optionModules = getDistinctModules();
    data = '<div id="optionsTabs">';
    data += '<ul>';
    data += '<li><a href="#divEspruino">Espruino</a></li>';
    data += '<li><a href="#divCredit">Credit</a></li>';
    for(i = 0; i < 3; i++){
      for(j in optionModules){
        if(optionModules[j].optionBlock.buttonLine === i){
          if(optionModules[j].active){data += '<li><a href="#div' + j + '">' + optionFieldActive(j); + '</a></li>';}
          else{data += '<li><a href="#div' + j + '">' + j + '</a></li>';}
        }
      } 
      data += '<br>';
    }   
    data += '</ul>';
    data += '<div id="divEspruino">' + divEspruino + '</div>';
    data += '<div id="divCredit">' + divCredit + '</div>';
    for(i in optionModules){
      om = optionModules[i];
      if(om.optionBlock.htmlData){data += '<div id="div' + om.optionBlock.module + '">' + om.optionBlock.htmlData + '</div>';}
      else{data += getOptionBlockDiv(i);}
    }
    data += '</div>';
    data += divButtons;
    $('<div id="optionsdiv" class=\"subform\" style=\"z-index:5\">' + data + '</div>').css(
        { position: 'absolute',display: 'none',top: 30,left: 200,width:370,
          border: '1px solid #fdd',padding: '2px','background-color': '#efe'
        }
      ).appendTo("body").fadeIn(200);
    $("#optionsTabs").tabs({ active: 0, collapsible: true });    
    setFormFromOptions();
    setBoardInfo();
    for(i = 0; i < optionBlocks.length; i++){
      if(optionBlocks[i].onForm){optionBlocks[i].onForm();}
    }
    $("#saveOptions").unbind().button({ text:false, icons: { primary: " ui-icon-arrowreturnthick-1-s" } }).click(Espruino.Options.saveOptions);
    $("#loadOptions").unbind().button({ text:false, icons: { primary: " ui-icon-arrowreturnthick-1-n" } }).click(Espruino.Options.loadOptions);
    $("#resetOptions").unbind().button({ text:false, icons: { primary: "ui-icon-refresh" } }).click(Espruino.Options.resetOptions);
    $("#saveOptionsToFile").button({ text: false, icons: { primary: "ui-icon-disk" } }).unbind().click(Espruino.Options.saveToFileOptions);
    $("#loadOptionsFromFile").button({ text: false, icons: { primary: "ui-icon-folder-open" } }).unbind().click(Espruino.Options.loadFromFileOptions);          
  }
  function setBoardInfo(){
    var html;
    if(!$.isEmptyObject(Espruino.Process.Env)){
      html += "<table border=\"1\">";
      for(var p in Espruino.Process.Env){
        html += "<tr><th>" + p + "</th><th>" + Espruino.Process.Env[p] + "</th></tr>";
      }
      html += "</table>";
    }
    else{ html = "";}
    $("#processInfo").html(html);
  }
  function getOptionBlockDiv(module){
    var r,i,of,h;
    r = '<div id="div' + module + '">\n';
    r += '<table border="1">\n';
    for(i in optionFields){
      of = optionFields[i];
      if(of.module === module){
        h = getHeader(of);
        r += '<tr><th>' + h.header;
        if(h.help){ r += h.help;}
        r += '</th><th>' + getInputElement(of) + '</th></tr>\n';
      }
    }
    r += '</table>\n';
    r += '</div>\n';
    return r;
  }
  function getHeader(of){
    var i,ho,r;
    for(i = 0; i < headerObject.length; i++){
      ho = headerObject[i];
      if(of.module === ho.module && of.field === ho.field ) return ho;
    }
    return {header: of.field };
  }
  function getInputElement(of){
    var i,r = "";
    switch(of.type){
      case "text":
        r += '<input type="text" id="' + of.id.substr(1) + '" size="50">';
        break;
      case "JSON":
        r += '<input type="text" id="' + of.id.substr(1) + '" size="50">';
        break;
      case "radio":
        for(i = 0; i < of.options.length; i++){
          r += of.options[i] + ' <input type="radio" class="' + of.field + '" name="' + of.field + '" value="' + of.options[i] + '">';
        }
        break;
      case "check":
        r += '<input type="checkbox" id="' + of.id.substr(1) + '">';
        break;
      case "select":
        r += '<select id="' + of.id.substr(1) + '">';
        for(i = 0; i < of.options.length; i++){
          r += '<option value="' + of.options[i] + '">' + of.options[i] + '</option>';
        }
        r += '</select>';
        break;
      case "directory":
        r += '<span id="' + of.divObject + '"></span><br>';
        r += '<button class="' + of.divObject + 'Button">Select</button>';
        r += '<input type="hidden" value="" id="' + of.divObject + 'Entry">';
        break;
    }  
    return r;
  }
  function optionFieldActive(module){
    var fld,i,r = module;
    fld = fieldActive(module);
    if(fld){ r += '<img id="img' + module + 'Active" src="" width="12px" height="12px">'; }
    else { r = module; }
    return r;
  }
  function fieldActive(module){
    var i;
    for(i in optionFields){
      if(optionFields[i].module === module){
        if(optionFields[i].field.indexOf("Active") > 0){ return optionFields[i];}
      }
    }
    return false;
  }
  function getDistinctModules(){
    var i,r = {},active;
    for(i in optionBlocks){
      if(!r[optionBlocks[i].module]){
        active = fieldActive(optionBlocks[i].module) !== false;  
        r[optionBlocks[i].module] = {active:active,optionBlock:optionBlocks[i]};}
    }
    return sortObject(r);
  }
  function sortObject(obj){
    var i,temp = [],r = {};
    for(i in obj){ temp.push(i);}
    temp.sort();
    for(i = 0; i < temp.length; i++){ if(!obj[temp[i]].active){r[temp[i]] = obj[temp[i]];}}
    for(i = 0; i < temp.length; i++){ if(obj[temp[i]].active){r[temp[i]] = obj[temp[i]];}}
    return r;
  }  function switchButtons(ui){
    if(ui.newHeader.hasClass("EspruinoOption")){$("#optionButtons").show();}
    else{$("#optionButtons").hide();}
  }
  function setFormFromOptions(){
    var value;
    for(var i = 0; i < optionFields.length; i++){
      //console.log(optionFields[i].id);
      if(optionFields[i].object){ value = Espruino[optionFields[i].module][optionFields[i].object][optionFields[i].field];}
      else{ value = Espruino[optionFields[i].module][optionFields[i].field];}
      switch(optionFields[i].type){
        case "text": $(optionFields[i].id).val(value);break;
        case "JSON": $(optionFields[i].id).val(JSON.stringify(value)); break;
        case "radio": $(optionFields[i].id).filter('[value="' + value + '"]').attr('checked',true);break;
        case "check": 
          $(optionFields[i].id).attr('checked',value);
          if(optionFields[i].id.indexOf("Active") > 0){
            if(value === true){ $("#img" + optionFields[i].module + "Active").attr("src","img/active.png");}
            else{$("#img" + optionFields[i].module + "Active").attr("src","img/inactive.png");}
          }
          break;
        case "select": $(optionFields[i].id).val(value);break;
        case "directory": $(optionFields[i].id).val(value);break;
      }
      if(optionFields[i].onBlur){
        $(optionFields[i].id).blur(callOnBlur);
      }
    }   
    function callOnBlur(){
      for(var i = 0; i < optionFields.length; i++){
        if(optionFields[i].id.substr(1) === this.id){
          setOptionFromForm(optionFields[i]);
          optionOnLoaded(optionFields[i]);
        }
      }
    }
  }
  function setOptionsFromForm(){
    for(var i = 0; i < optionFields.length; i++){ setOptionFromForm(optionFields[i]); }      
  }
  function setOptionFromForm(optionField){
    var value="";
    switch(optionField.type){
      case "text": value = $(optionField.id).val(); break;
      case "JSON": value = JSON.parse($(optionField.id).val());break;
      case "radio": value = $(optionField.id).filter(":checked").val();break;
      case "check": value = $(optionField.id)[0].checked;break;
      case "select": value = $(optionField.id).val();break;  
      case "directory": value = $(optionField.id).val();break; 
    }
    if(optionField.object){Espruino[optionField.module][optionField.object][optionField.field] = value;}
    else{Espruino[optionField.module][optionField.field] = value;}
  }
  function getOptionsObj(){
    var optionsObj = {},fld;
    for(var i = 0; i < optionFields.length; i++){
        if(optionFields[i].object){
            fld = {};
            fld[optionFields[i].module] = {};
            fld[optionFields[i].module][optionFields[i].object] = {};
            fld[optionFields[i].module][optionFields[i].object][optionFields[i].field] = Espruino[optionFields[i].module][optionFields[i].object][optionFields[i].field];
            optionsObj = $.extend(true,optionsObj,fld);
        }
        else{
            fld = {};
            fld[optionFields[i].module] = {};
            fld[optionFields[i].module][optionFields[i].field] = Espruino[optionFields[i].module][optionFields[i].field];
            optionsObj = $.extend(true,optionsObj,fld);
        }
    }
    return optionsObj;  
  }
  function setOptionsFromObject(EO){
    var val;
    for(var i = 0; i < optionFields.length; i++){
      try{
        if(optionFields[i].object){
          val = EO[optionFields[i].module][optionFields[i].object][optionFields[i].field];
          if(typeof val !== "undefined"){
            Espruino[optionFields[i].module][optionFields[i].object][optionFields[i].field] = val;
          }
        }
        else{
          val = EO[optionFields[i].module][optionFields[i].field];
          if(typeof val !== "undefined"){          
            Espruino[optionFields[i].module][optionFields[i].field] = val;
          }
        }
      }
      catch(e){ console.log("Option Error:",e,"on",optionFields[i]);}      
    }      
  }
  function optionsOnLoaded(){
    var value,i;
    for(i = 0; i < optionFields.length; i++){ optionOnLoaded(optionFields[i]); } 
    for(i = 0; i < optionBlocks.length; i++){ if(optionBlocks[i].onLoaded){optionBlocks[i].onLoaded();}
    } 
  }
  function optionOnLoaded(optionField){
    var value;
    if(optionField.onLoaded){ 
      if(optionField.object){ value = Espruino[optionField.module][optionField.object][optionField.field];}
      else{ value = Espruino[optionField.module][optionField.field];}
      optionField.onLoaded(value);
    }  
  }
  Espruino.Options["loadHtml"] = function(ob){ $.get(ob.htmlUrl,function(data){ob["htmlData"] = data;})}
  Espruino.Options["saveOptions"] = function(){
    var optionsObj;
    setOptionsFromForm();
    optionsObj = getOptionsObj();
    chrome.storage.local.set({EspruinoOptions:optionsObj});
    optionsOnLoaded();
    $(".subform").hide();   
  };
  Espruino.Options["resetOptions"] = function(){
    setFormFromOptions();
  };
  Espruino.Options["loadOptions"] = function(callback){
    chrome.storage.local.get("EspruinoOptions",function(result){
      if(!$.isEmptyObject(result)){
        setOptionsFromObject(result.EspruinoOptions);     
        setFormFromOptions();
        if(callback){ callback(); }
      }
    });
  };
  Espruino.Options["saveToFileOptions"] = function(){
    var optionsObj;
    setOptionsFromForm();
    optionsObj = JSON.stringify(getOptionsObj());
    saveAs(new Blob([Espruino.General.convertToOS(optionsObj)], { type: "text/plain" }), defaultFileName); 
    optionsOnLoaded();
    $(".subform").hide();
  };
  Espruino.Options["loadFromFileOptions"] = function(callback){
    $("#fileOptions").change(function(event){
      var reader = new FileReader();
      reader.onload = function(event) {
        var data = JSON.parse(Espruino.General.convertFromOS(event.target.result));
        setOptionsFromObject(data);
        setFormFromOptions();
        if(callback){ callback();}
      };
      reader.readAsText(event.target.files[0]);  
    });
    $("#fileOptions").click();
  };
})();
