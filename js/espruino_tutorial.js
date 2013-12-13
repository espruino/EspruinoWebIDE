/*
 * The MIT License

Copyright (c) 2013 by Gordon Williams

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
    // Status/progress bar
    Espruino["Tutorial"] = {};
    
    var tutorialData = [];
    
    function loadTutorial(text) {
      var step = { text : "", command : "" };
      tutorialData = [ ];
      var lines = text.split("\n");
      for (var i in lines) {
        var l = lines[i].trim();
        if (l.substr(0,2)=="//") {
          var text = l.substr(2);
          if (text=="") text="\n";
          step.text += text;
        } else
          step.command += l;
        if (l=="" && step.text!="") {
          tutorialData.push(step);
          step = { text : "", command : "" };          
        }
      }      
      if (step.text!="") 
        tutorialData.push(step);
      // test
      // Espruino.Terminal.setExtraText(0,tutorialData[0].text);
    }
    
    
    
    Espruino.Tutorial.init = function(){
      $.get( "data/tutorials/1.js", loadTutorial);
    };
    
    Espruino.Tutorial.getTutorialData = function() {
       return tutorialData;
    };

    
})();
