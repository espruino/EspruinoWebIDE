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
(function(){
  Espruino["General"] = {};
  Espruino.General.startMode = "JS";
  Espruino.General.webCamOn = false;
  Espruino.General.flashFirmwareUrl = "http://www.espruino.com/binaries/espruino_r1v1_1v43.bin";
  Espruino.General["initOptions"] = function(){
    Espruino.Options.optionFields.push({id:".startMode",module:"General",field:"startMode",type:"radio"});
    Espruino.Options.optionFields.push({id:"#webCamOn",module:"General",field:"webCamOn",type:"check",onLoaded:switchWebCam});
    Espruino.Options.optionFields.push({id:"#flashFirmwareUrl",module:"General",field:"flashFirmwareUrl",type:"text"});
    Espruino.Options.optionBlocks.push({id:"#divOptionGeneral",htmlUrl:"data/Espruino_General.html"})
    Espruino.Options.optionBlocks.push({id:"#divOptionFlashFirmware",htmlUrl:"data/Espruino_FlashFirmware.html"})
  };
  Espruino.General.pinRegExp = /\/\*.+?\*\/.+?(,|\)|\])/g;
  Espruino.General.isWindows = navigator.userAgent.indexOf("Windows")>=0;
  Espruino.General["setEditorCode"] = function(code,mode){
      if(!mode){mode = $("#replaceInEditor")[0].checked;}
      if(mode){Espruino.codeEditor.setValue(code);}
      else{ Espruino.codeEditor.setValue(Espruino.codeEditor.getValue() + "\n" + code); }
  };
  Espruino.General["init"] = function(){
      CodeMirror.commands.autocomplete = function(cm) {
        CodeMirror.showHint(cm, CodeMirror.hint.espruino);
      };
      Espruino.codeEditor.on("contextmenu", function(cm,evt){ 
        if(cm.somethingSelected()){console.log(cm.getSelection());}
        else{
            var re =  /[\w$]/ ;
            var cur = cm.getCursor(), line = cm.getLine(cur.line), start = cur.ch, end = start;
            while (start && re.test(line.charAt(start - 1))) --start;
            while (end < line.length && re.test(line.charAt(end))) ++end;
            console.log(line.substring(start,end));
        }
      });
      $("#divcode").click(function(){$(".subform").hide();});
      $("#terminal").click(function(){$(".subform").hide();});
      
  };
  Espruino.General.setEditorLine = function(){
      var lineNr,start,end;
      lineNr = parseInt(this.title) - 1;
      start = parseInt($(this).attr("start"));
      end = parseInt($(this).attr("end")) - 1;
      Espruino.codeEditor.setSelection({line:lineNr,ch:start},{line:lineNr,ch:end});
  };
  Espruino.General.convertFromOS = function (chars) {
    if (!Espruino.General.isWindows) return chars;
    return chars.replace(/\r\n/g,"\n");
  };
  Espruino.General.convertToOS = function (chars) {
    if (!Espruino.General.isWindows) return chars;
    return chars.replace(/\r\n/g,"\n").replace(/\n/g,"\r\n");
  };
  function switchWebCam(status){ 
      if(status === true){ $(".webcam").show(500);}
      else{ $(".webcam").hide(); }
  }
})();
$.fn.selectRange = function(start, end) {
    if(!end) end = start; 
    return this.each(function() {
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        } else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};

