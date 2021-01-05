/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  CodeMirror JavaScript editor
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  var codeMirror;
  var codeMirrorDirty = false;
  var defaultLintFlags = {
    esversion   : 6,    // Enable ES6 for literals, arrow fns, binary
    evil        : true, // don't warn on use of strings in setInterval
    laxbreak    : true,  // don't warn about newlines in expressions
    laxcomma    : true  // don't warn about commas at the start of the line
  };

  function init() {
    // Options
    Espruino.Core.Config.add("KEYMAP", {
      section : "General",
      name : "JavaScript Editor Keymap",
      description : "Changes the keymap for the JavaScript editor.",
      type : { "emacs": "Emacs", "vim": "Vim", "sublime": "Sublime" },
      defaultValue : "sublime",
      onChange : function(newValue) {
        if (codeMirror) {
          codeMirror.setOption('keyMap', Espruino.Config.KEYMAP);
        }
      }
    });
    Espruino.Core.Config.add("THEME", {
      section : "General",
      name : "JavaScript Editor Theme",
      description : "Changes the colour scheme for the JavaScript editor.",
      type : { "default": "default", "3024-day": "3024-day", "3024-night": "3024-night", "abcdef": "abcdef", "ambiance": "ambiance", "ayu-dark": "ayu-dark", "ayu-mirage": "ayu-mirage", "base16-dark": "base16-dark", "base16-light": "base16-light", "bespin": "bespin", "blackboard": "blackboard", "cobalt": "cobalt", "colorforth": "colorforth", "darcula": "darcula", "dracula": "dracula", "duotone-dark": "duotone-dark", "duotone-light": "duotone-light", "eclipse": "eclipse", "elegant": "elegant", "espruino": "espruino", "erlang-dark": "erlang-dark", "gruvbox-dark": "gruvbox-dark", "hopscotch": "hopscotch", "icecoder": "icecoder", "idea": "idea", "isotope": "isotope", "lesser-dark": "lesser-dark", "liquibyte": "liquibyte", "lucario": "lucario", "material": "material", "material-darker": "material-darker", "material-palenight": "material-palenight", "material-ocean": "material-ocean", "mbo": "mbo", "mdn-like": "mdn-like", "midnight": "midnight", "monokai": "monokai", "moxer": "moxer", "neat": "neat", "neo": "neo", "night": "night", "nord": "nord", "oceanic-next": "oceanic-next", "panda-syntax": "panda-syntax", "paraiso-dark": "paraiso-dark", "paraiso-light": "paraiso-light", "pastel-on-dark": "pastel-on-dark", "railscasts": "railscasts", "rubyblue": "rubyblue", "seti": "seti", "shadowfox": "shadowfox", "solarized dark": "solarized dark", "solarized light": "solarized light", "the-matrix": "the-matrix", "tomorrow-night-bright": "tomorrow-night-bright", "tomorrow-night-eighties": "tomorrow-night-eighties", "ttcn": "ttcn", "twilight": "twilight", "vibrant-ink": "vibrant-ink", "xq-dark": "xq-dark", "xq-light": "xq-light", "yeti": "yeti", "yonce": "yonce", "zenburn": "zenburn" },
      defaultValue : "default",
      onChange : function(newValue) {
        if (codeMirror) {
          loadThemeCSS(Espruino.Config.THEME);
          codeMirror.setOption('theme', Espruino.Config.THEME);
        }
      }
    });
    Espruino.Core.Config.add("INDENTATION_TYPE", {
      section : "General",
      name : "Indentation Type",
      description : "Whether to indent using spaces or tab characters",
      type : { "spaces": "Spaces", "tabs": "Tabs" },
      defaultValue : "spaces",
      onChange : function(newValue) {
        if (codeMirror) {
          codeMirror.setOption('indentWithTabs', !!(Espruino.Config.INDENTATION_TYPE == "tabs"));
        }
      }
    });
    Espruino.Core.Config.add("TAB_SIZE", {
      section : "General",
      name : "Indentation Size",
      description : "The number of space characters an indentation should take up",
      type : {1:1,2:2,4:4,8:8},
      defaultValue : 2,
      onChange : function(newValue) {
        if (codeMirror) {
          codeMirror.setOption('tabSize', Espruino.Config.TAB_SIZE);
          codeMirror.setOption('indentUnit', Espruino.Config.TAB_SIZE);
        }
      }
    });
    Espruino.Core.Config.add("DISABLE_CODE_HINTS", {
      section : "General",
      name : "Disable Code Hints",
      description : "Disable code hints in the editor. BE CAREFUL - they're there "+
      "for a reason. If your code is creating warnings then it may well not work "+
      "on Espruino! (needs a restart to take effect)",
      type : "boolean",
      defaultValue : false,
      onChange: function(newValue) {
          if (codeMirror) {
            codeMirror.setOption('lint', (Espruino.Config.DISABLE_CODE_HINTS) ? false : defaultLintFlags);
          }
      }
    });
    loadThemeCSS(Espruino.Config.THEME);
    $('<div id="divcode" style="width:100%;height:100%;"><textarea id="code" name="code"></textarea></div>').appendTo(".editor--code .editor__canvas");
    // The code editor
    codeMirror = CodeMirror.fromTextArea(document.getElementById("code"), {
      width: "100%",
      height: "100%",
      lineNumbers: true,
      matchBrackets: true,
      mode: {name: "javascript", globalVars: false},
      lineWrapping: true,
      showTrailingSpace: true,
      lint: ((Espruino.Config.DISABLE_CODE_HINTS) ? false : defaultLintFlags),
      highlightSelectionMatches: {showToken: /\w/},
      foldGutter: {rangeFinder: new CodeMirror.fold.combine(CodeMirror.fold.brace, CodeMirror.fold.comment, CodeMirror.fold.indent)},
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
      keyMap: Espruino.Config.KEYMAP,
      theme: Espruino.Config.THEME,
      indentWithTabs: !!(Espruino.Config.INDENTATION_TYPE == "tabs"),
      tabSize: Espruino.Config.TAB_SIZE,
      indentUnit: Espruino.Config.TAB_SIZE,
      extraKeys: {
        "Tab" : function(cm) {
          if (cm.somethingSelected()) {
            // `cm.indentSelection("add");` has been replaced due to issues when
            // indenting using 4 spaces rather than 2. Instead, this for loop
            // will iterate each line and indent that line. For lines where
            // there's spaces that don't match an indentation level, the line
            // will be snapped to the next tab stop.
            // Also works with indentations that use the tab character!
            for (var line = cm.getCursor(true).line; line <= cm.getCursor(false).line; line++) {
              var spacesAlreadyIndented = cm.getLine(line).search(/\S|\t|$/) % cm.getOption("indentUnit");

              cm.indentLine(line, cm.getOption("indentUnit") - spacesAlreadyIndented);
            }
          } else { // make sure the tab key indents with spaces
            cm.replaceSelection(cm.getOption("indentWithTabs")? "\t":
              " ".repeat(cm.getOption("indentUnit")), "end", "+input");
          }
        }
      }
    });
    // When things have changed...
    codeMirror.on("change", function(cm, changeObj) {
      // If pasting, make sure text gets pasted in the right format
      if (changeObj.origin == "paste") {
        var c = cm.getCursor();
        var code = cm.getValue();
	      var newcode = Espruino.Core.Utils.fixBrokenCode(code);
	      if (newcode!=code) {
          // Only set if code has changed, as it moves the scrollbar location :(
          cm.setValue(newcode);
          cm.setCursor(c);
        }
      }
      // Send an event for code changed
      Espruino.callProcessor("jsCodeChanged", { code : cm.getValue() } );
    });
    // Handle hovering
    CodeMirror.on(codeMirror.getWrapperElement(), "mouseover", function(e) {
      var node = e.target || e.srcElement;
      if (node) {
        var stillInNode = true;
        CodeMirror.on(node, "mouseout", function mo() {
          CodeMirror.off(node, "mouseout", mo);
          stillInNode = false;
        });
        Espruino.callProcessor("editorHover", {
          node : node,
          showTooltip : function(htmlNode) {
            if (stillInNode) showTooltipFor(e, htmlNode, node);
          }
        });
      }
    });
    CodeMirror.on(codeMirror.getWrapperElement(), "mouseout", function(e) {
      var tooltips = document.getElementsByClassName('CodeMirror-Tern-tooltip');
        while(tooltips.length)
          tooltips[0].parentNode.removeChild(tooltips[0]);
    });
  }


  function getCode() {
    var code = codeMirror.getValue();
    // replace the Non-breaking space character with space. This seems to be an odd Android thing
    code = code.replace(/\xA0/g," ");
    return code;
  }

  function getSelectedCode() {
    var code = codeMirror.getSelection();
    // replace the Non-breaking space character with space. This seems to be an odd Android thing
    code = code.replace(/\xA0/g," ");
    return code;
  }

  function setCode(code) {
    codeMirror.setValue(code);
    codeMirrorDirty = true;
  }

  function loadThemeCSS(selectedTheme) {
    var codeMirrorMainCSS = document.querySelector('link[href$="codemirror.css"]');
    var codeMirrorThemeCSS = document.querySelector('link[href^="js/libs/codemirror/theme/"]');

    // default theme css lives in main css and doesn't need an extra sheet loaded
    if (selectedTheme === 'default') {
      if (codeMirrorThemeCSS) {
        codeMirrorThemeCSS.parentNode.remove(codeMirrorThemeCSS); // remove previous theme css sheet
      }
    }else{
      selectedTheme = selectedTheme.replace(/solarized\s(dark|light)/, 'solarized'); // edge case for solarized theme: 1 sheet for both themes

      var newThemeCSS = 'js/libs/codemirror/theme/' + selectedTheme + '.css';

      if (!codeMirrorThemeCSS) {
        codeMirrorThemeCSS = document.createElement('link');
        codeMirrorThemeCSS.href = newThemeCSS;
        codeMirrorThemeCSS.setAttribute('rel', 'stylesheet');

        if (codeMirrorMainCSS) {
          codeMirrorMainCSS.parentNode.insertBefore(codeMirrorThemeCSS, codeMirrorMainCSS.nextSibling);
        }

      } else if (newThemeCSS !== codeMirrorThemeCSS.href) {
        codeMirrorThemeCSS.href = newThemeCSS;
      }
    }
  }

  /** Called this when we switch modes from blockly - the editor needs a prod to update if the code
   * was set when it was invisible */
  function madeVisible() {
    if (codeMirrorDirty) {
      codeMirrorDirty = false;
      // important we do it a bit later so things have had time to lay out
      setTimeout(function () {
        codeMirror.refresh();
      }, 1);
    }
  }

  // --------------------------------------------------------------------------
  // Stolen from codemirror's lint.js (not exported :( )
  // --------------------------------------------------------------------------

  function showTooltip(e, content) {
    var tt = document.createElement("div");
    tt.className = "CodeMirror-lint-tooltip";
    tt.appendChild(content.cloneNode(true));
    document.body.appendChild(tt);

    function position(e) {
      if (!tt.parentNode) return CodeMirror.off(document, "mousemove", position);
      tt.style.top = Math.max(0, e.clientY - tt.offsetHeight - 5) + "px";
      tt.style.left = (e.clientX + 5) + "px";
    }
    CodeMirror.on(document, "mousemove", position);
    position(e);
    if (tt.style.opacity != null) tt.style.opacity = 1;
    return tt;
  }
  function rm(elt) {
    if (elt.parentNode) elt.parentNode.removeChild(elt);
  }
  function hideTooltip(tt) {
    if (!tt.parentNode) return;
    if (tt.style.opacity == null) rm(tt);
    tt.style.opacity = 0;
    setTimeout(function() { rm(tt); }, 600);
  }

  function showTooltipFor(e, content, node) {
    // remove any existing codemirror tooltips
    var tooltips = document.getElementsByClassName('CodeMirror-Tern-tooltip');
    while(tooltips.length)
      tooltips[0].parentNode.removeChild(tooltips[0]);

    var tooltip = showTooltip(e, content);
    function hide() {
      CodeMirror.off(node, "mouseout", hide);
      if (tooltip) { hideTooltip(tooltip); tooltip = null; }
    }
    var poll = setInterval(function() {
      if (tooltip) for (var n = node;; n = n.parentNode) {
        if (n == document.body) return;
        if (!n) { hide(); break; }
      }
      if (!tooltip) return clearInterval(poll);
    }, 400);
    CodeMirror.on(node, "mouseout", hide);
  }

  //--------------------------------------------------------------------------
  //--------------------------------------------------------------------------
  //--------------------------------------------------------------------------

  Espruino.Core.EditorJavaScript = {
    init : init,
    getCode : getCode,
    getSelectedCode : getSelectedCode, // get the currently highlighted bit of code
    setCode : setCode,
    madeVisible : madeVisible,
    getCodeMirror : function () { return codeMirror; }
  };
}());
