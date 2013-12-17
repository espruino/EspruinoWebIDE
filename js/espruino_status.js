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
    Espruino["Status"] = {};
    
    var statusBox, progressBox, progressIndicator;
    var progressAmt, progressMax = 0;
    
    Espruino.Status.init = function(){
      statusBox = $("#status");
      progressBox = $("#progress");
      progressIndicator = $("#progressindicator");
      progressBox.hide();
    };
    
    Espruino.Status.setStatus = function(text, progress) {
      console.log(">>> "+text);
      statusBox.html(text);
      if (progress === undefined) {
        progressIndicator.width(0);
        progressBox.hide();        
        progressMax = 0;
      } else {
        progressBox.show();
        if (progress<1) progress=1;
        progressAmt = 0;
        progressMax = progress;
      }
    };

    Espruino.Status.setError = function(text) {
      Espruino.Status.setStatus("ERROR:"+text);
    };

    Espruino.Status.hasProgress = function() {
      return progressMax>0;
    };    
    
    Espruino.Status.incrementProgress = function(amount) {
      if (!Espruino.Status.hasProgress()) return;      
      progressAmt += amount;
      var width = (progressAmt * 100.0 / progressMax)|0;
      //console.log(progressAmt,progressMax,width);
      if (width>100) width=100;
      progressIndicator.width(width);
    };
    

    
})();
