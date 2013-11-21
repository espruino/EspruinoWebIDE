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
    Espruino["Minify"] = {};
    Espruino.Minify.sendMinified = false;
    Espruino.Minify.compilationLevel = "SIMPLE_OPTIMIZATIONS";
    var minifyUrl = "http://closure-compiler.appspot.com/compile";
    
    Espruino.Minify.init = function(){
    
    };
    Espruino.Minify.MinifyCode = function(data,callback){
      var minifyObj = $.param({
        compilation_level:Espruino.Minify.compilationLevel,
        output_format:"text",
        output_info:"compiled_code",
        js_code:data
      });
      $.post(minifyUrl,minifyObj,function(data){
        callback(data);  
      },"text");
    };    
})();
