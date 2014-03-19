/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  File Load/Save
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  
  function init() {
    // Configuration
    
   
    // Add stuff we need
    Espruino.Core.Layout.addIcon({ name: "folder-open", title : "Open File", order: 100, area: "splitter" }, function() {
      $( "#fileLoader" ).click();
    });
    Espruino.Core.Layout.addIcon({ name: "save", title : "Save File", order: 200, area: "splitter" }, function() {
      if (Espruino.Core.Layout.isInBlockly()) 
        saveFile(Espruino.Core.EditorBlockly.getXML(), "code_blocks.xml");
      else
        saveFile(Espruino.Core.EditorJavaScript.getCode(), "code.js");
    });
    
    
    // required for file loading... (hidden)
    $('<input type="file" id="fileLoader" style="display: none;"/>').appendTo(document.body);
     
    /*/$( ".reload" ).button( { text: false, icons: { primary: "ui-icon-refresh" } } ).click( function () {
      $('#fileLoader').change();
    });*/
    
    $("#fileLoader").change(function(event) {
      if (event.target.files.length != 1) return;
      var reader = new FileReader();
      reader.onload = function(event) {
        var data = convertFromOS(event.target.result);
        if (Espruino.Core.Layout.isInBlockly()) {
          Espruino.Core.EditorBlockly.setXML(data);          
        } else { 
          Espruino.Core.EditorJavaScript.setCode(data);
        }
        document.getElementById('load').value = '';
      };
      reader.readAsText(event.target.files[0]);
    });
        
  }
  
  /**  Handle newline conversions - Windows expects newlines as /r/n when we're saving/loading files */
  function convertFromOS(chars) {
   if (!Espruino.Core.Utils.isWindows()) return chars;
   return chars.replace(/\r\n/g,"\n");
  };
  
  /**  Handle newline conversions - Windows expects newlines as /r/n when we're saving/loading files */
  function convertToOS(chars) {
   if (!Espruino.Core.Utils.isWindows()) return chars;
   return chars.replace(/\r\n/g,"\n").replace(/\n/g,"\r\n");
  };  
  
  var saveFile = function(data, filename) {
    saveAs(new Blob([convertToOS(data)], { type: "text/plain" }), filename);
  };  

  Espruino.Core.File = {
    init : init
  };
}());