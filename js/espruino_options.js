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
  Espruino.Options = {};
  var urlOptions = "data/options.html", defaultFileName = "EspruinoOptions";
  var optionFields = [];
  var optionBlocks = [];
  var maxWait = 5000;
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
  };
  function openOptionsForm(){
    var html = "";
    $("#optionsdiv").remove();
    if(!$.isEmptyObject(Espruino.Process.Env)){
      html += "<table border=\"1\">";
      for(var p in Espruino.Process.Env){
        html += "<tr><th>" + p + "</th><th>" + Espruino.Process.Env[p] + "</th></tr>";
      }
      html += "</table>";
    }
    else{ html = "";}
    $.get(urlOptions,function(data){
      $('<div id="optionsdiv" class=\"subform\" style=\"z-index:5\">' + data + '</div>').css(
        { position: 'absolute',display: 'none',top: 30,left: 200,
          border: '1px solid #fdd',padding: '2px','background-color': '#efe'
        }
      ).appendTo("body").fadeIn(200);
      window.setTimeout(function(){
        $("#processInfo").html(html);
        var defs = [];
        for(var i = 0; i < optionBlocks.length; i++){
          if(optionBlocks[i].htmlUrl){
            defs.push(loadOptionsHtml(optionBlocks[i].htmlUrl));
          }
        }
        if(defs.length > 0){$.when.apply(null,defs).then(function(){htmlLoaded();});}
        function loadOptionsHtml(path){
          var dfd = $.Deferred(),t;
          t = setInterval(function(){clearInterval(t);dfd.reject();},maxWait);
          $.get(path,function(data){
            $("#optionsAccordion").append(data);
            dfd.resolve();  
          },"text").fail(function(a,b){ console.log(a,b);});
          return dfd.promise();   
        }
        function htmlLoaded(){
          for(var i = 0; i < optionBlocks.length; i++){
            if(optionBlocks[i].html){ $("#optionsAccordion").append(optionBlocks[i].html);}
          }
          $("#optionsAccordion").accordion({ active: 0, collapsible: true, beforeActivate: function( event, ui ) {switchButtons(ui);} });
          setFormFromOptions();
          $("#saveOptions").unbind().button({ text:false, icons: { primary: " ui-icon-arrowreturnthick-1-s" } }).click(Espruino.Options.saveOptions);
          $("#loadOptions").unbind().button({ text:false, icons: { primary: " ui-icon-arrowreturnthick-1-n" } }).click(Espruino.Options.loadOptions);
          $("#resetOptions").unbind().button({ text:false, icons: { primary: "ui-icon-refresh" } }).click(Espruino.Options.resetOptions);
          $("#saveOptionsToFile").button({ text: false, icons: { primary: "ui-icon-disk" } }).unbind().click(Espruino.Options.saveToFileOptions);
          $("#loadOptionsFromFile").button({ text: false, icons: { primary: "ui-icon-folder-open" } }).unbind().click(Espruino.Options.loadFromFileOptions);
        // Set up the firmware flasher
          $( "#flashFirmware" ).button().click(function() {
            Espruino.Flasher.flashDevice($("#flashFirmwareUrl").val() ,function (err) {
              Espruino.Terminal.grabSerialPort();
              if (err) {
                Espruino.Status.setStatus("Error Flashing.");
                console.log(err);
                //alert(err);
              }
              else Espruino.Status.setStatus("Done.");
            });
          });
        }
      },10);
    },"text");
  }
  function switchButtons(ui){
    if(ui.newHeader.hasClass("EspruinoOption")){$("#optionButtons").show();}
    else{$("#optionButtons").hide();}
  }
  function setFormFromOptions(){
    var value;
    for(var i = 0; i < optionFields.length; i++){
      if(optionFields[i].object){ value = Espruino[optionFields[i].module][optionFields[i].object][optionFields[i].field];}
      else{ value = Espruino[optionFields[i].module][optionFields[i].field];}
      switch(optionFields[i].type){
        case "text": $(optionFields[i].id).val(value);break;
        case "JSON": $(optionFields[i].id).val(JSON.stringify(value)); break;
        case "radio": $(optionFields[i].id).filter('[value="' + value + '"]').attr('checked',true);break;
        case "check": $(optionFields[i].id).attr('checked',value);break;
        case "select": $(optionFields[i].id).val(value);break;
        break;
      }
    }   
  }
  function setOptionsFromForm(){
    for(var i = 0; i < optionFields.length; i++){
      switch(optionFields[i].type){
        case "text":
          if(optionFields[i].object){Espruino[optionFields[i].module][optionFields[i].object][optionFields[i].field] = $(optionFields[i].id).val();}
          else{Espruino[optionFields[i].module][optionFields[i].field] = $(optionFields[i].id).val();}
          break;
        case "JSON":
          if(optionFields[i].object){Espruino[optionFields[i].module][optionFields[i].object][optionFields[i].field] = JSON.parse($(optionFields[i].id).val());}
          else{Espruino[optionFields[i].module][optionFields[i].field] = JSON.parse($(optionFields[i].id).val());}
          break;
        case "radio":
          if(optionFields[i].object){Espruino[optionFields[i].module][optionFields[i].object][optionFields[i].field] = $(optionFields[i].id).filter(":checked").val();}
          else{Espruino[optionFields[i].module][optionFields[i].field] = $(optionFields[i].id).filter(":checked").val();}
          break;
        case "check":
          if(optionFields[i].object){Espruino[optionFields[i].module][optionFields[i].object][optionFields[i].field] = $(optionFields[i].id)[0].checked;}
          else{Espruino[optionFields[i].module][optionFields[i].field] = $(optionFields[i].id)[0].checked;}
          break;
        case "select":
          if(optionFields[i].object){Espruino[optionFields[i].module][optionFields[i].object][optionFields[i].field] = $(optionFields[i].id).val();}
          else{Espruino[optionFields[i].module][optionFields[i].field] = $(optionFields[i].id).val();}
          break;
      }
    }      
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
    for(var i = 0; i < optionFields.length; i++){
      if(optionFields[i].object){
        Espruino[optionFields[i].module][optionFields[i].object][optionFields[i].field] = 
        EO[optionFields[i].module][optionFields[i].object][optionFields[i].field];
      }
      else{
        Espruino[optionFields[i].module][optionFields[i].field] =
        EO[optionFields[i].module][optionFields[i].field];
      }
    }        
  }
  function optionsOnLoaded(){
    var value;
    for(var i = 0; i < optionFields.length; i++){
      if(optionFields[i].onLoaded){ 
        if(optionFields[i].object){ value = Espruino[optionFields[i].module][optionFields[i].object][optionFields[i].field];}
        else{ value = Espruino[optionFields[i].module][optionFields[i].field];}
        optionFields[i].onLoaded(value);
      }
    }  
  }
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
