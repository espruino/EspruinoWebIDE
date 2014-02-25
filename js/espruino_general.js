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
  Espruino["General"] = {};
  Espruino.General.startMode = "JS";
  Espruino.General.webCamOn = false;
  Espruino.General.showReloadButton = false;
  Espruino.General["initOptions"] = function(){
    Espruino.Options.optionFields.push({id:".startMode",module:"General",field:"startMode",type:"radio"});
    Espruino.Options.optionFields.push({id:"#webCamOn",module:"General",field:"webCamOn",type:"check",onLoaded:switchWebCam,onBlur:true});
    Espruino.Options.optionFields.push({id:"#showReloadButton",module:"General",field:"showReloadButton",type:"check",onLoaded:switchReloadButton,onBlur:true});
    Espruino.Options.optionBlocks.push({id:"#divOptionGeneral",htmlUrl:"data/Espruino_General.html"});
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
  Espruino.General.ShowSubForm = function(divName,top,left,html,bgcolor,appendTo,divClass){
      var cls = divClass?divClass:"subform";
      $("#" + divName).remove();      
      $('<div id="' + divName + '" class="' + cls + ' style="z-index:5">' + html + '</div>').css(
        { position: 'absolute',display: 'none',top: top,left: left,
          border: '1px solid #fdd',padding: '2px','background-color': bgcolor
        }
      ).appendTo(appendTo).fadeIn(200);      
  };
  function switchWebCam(status){ 
      if(status === true){ $(".webcam").show(500);}
      else{ $(".webcam").hide(); }
  }
  function switchReloadButton(status) {
    if (status === true) { $('.reload').show(500);}
    else { $('.reload').hide(); }
  }
  
  Espruino.General.escapeHTML = (function () {
    var chr = { '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;', ' ': '&nbsp;' };
    return function (text) {
        return text.replace(/[\"&<> ]/g, function (a) { return chr[a]; });
    };
  }());
  
  Espruino.General.getSubString = function(str, from, len) {
    if (len == undefined) {
      return str.substr(from, len);
    } else {
      var s = str.substr(from, len);
      while (s.length < len) s+=" ";
      return s;
    }
  };
  
  Espruino.General.markdownToHTML = function(markdown) {
    var html = markdown;
    //console.log(JSON.stringify(html));
    html = html.replace(/\n\s*\n/g, "\n<br/><br/>\n"); // newlines
    html = html.replace(/\*\*(.*)\*\*/g, "<strong>$1</strong>"); // bold
    html = html.replace(/```(.*)```/g, "<span class=\"code\">$1</span>"); // code
    //console.log(JSON.stringify(html));
    return html;
  };  
  
  Espruino.General.versionToFloat = function(version) {
    return parseFloat(version.trim().replace("v","."));
  };    
  
  /** Get a Lexer to parse JavaScript - this is really very nasty right now and it doesn't lex even remotely properly.
   * It'll return {type:"type", str:"string", value:"string_only_sometimes"}, until EOF when it returns undefined */
  Espruino.General.getLexer = function(str) {
    // Nasty lexer - no comments/etc
    var chAlpha="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var chNum="0123456789";
    var chAlphaNum = chAlpha+chNum;
    var chWhiteSpace=" \t\n\r";
    var chQuotes = "\"'";
    var ch = str[0];
    var idx = 1;
    var nextCh = function() { ch = str[idx++]; };
    var isIn = function(s,c) { return s.indexOf(c)>=0; } ;
    var nextToken = function() {
      while (isIn(chWhiteSpace,ch)) nextCh();
      if (ch==undefined) return undefined; 
      if (ch=="/") {
        nextCh();
        if (ch=="/") {
          // single line comment
          while (ch!==undefined && ch!="\n") nextCh();
          return nextToken();
        } else if (ch=="*") {
          nextCh();
          var last = nextCh();
          // multiline comment          
          while (ch!==undefined && !(last=="*" && ch=="/")) {
            last = ch;
            nextCh();
          }
          nextCh();
          return nextToken();
        }
        return {type:"CHAR", str:"/", value:"/"};
      }
      var s = "";        
      var type, value;
      if (isIn(chAlpha,ch)) { // ID
        type = "ID";
        do {
          s+=ch;
          nextCh();
        } while (isIn(chAlphaNum,ch));
      } else if (isIn(chNum,ch)) { // NUMBER
        type = "NUMBER";
        do {
          s+=ch;
          nextCh();
        } while (isIn(chNum,ch) || ch==".")
      } else if (isIn(chQuotes,ch)) { // STRING
        type = "STRING";
        var q = ch;
        value = "";
        s+=ch;
        nextCh();
        while (ch!==undefined && ch!=q) {
          s+=ch;
          value += ch;
          nextCh();
        };        
        if (ch!==undefined) s+=ch;
        nextCh();
      } else {
        type = "CHAR";
        s+=ch;
        nextCh();
      }
      if (value===undefined) value=s;
      return {type:type, str:s, value:value};
    };
    
    return {
      next : nextToken
    };
  };
  
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

