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
    var selectHTML;
    Espruino.Snippet.init = function(){
        $(".snippetsButton").button({ text: false, icons: { primary: "ui-icon-script" } }).click(function() {
            $("#scriptList").html(selectHTML);
            $(".subform").hide();
            $("#divScripts").show();
            $("#snippets").unbind();
            $("#snippets").change(loadSnippet);                
        });
        loadSnippets("data/snippets.txt");
    };  
    function loadSnippets(url){
        $.getJSON(url,function(data){
            dataSnippets = data;
            var snippet,html = "<select id=\"snippets\">";
            html += "<option value=\"\">select a snippet</option>";
            for(var i = 0; i < data.snippetGroups.length; i++){
                html +="<optgroup label=\"" + data.snippetGroups[i].description + "\" />";
                for(var j = 0; j < data.snippetGroups[i].snippets.length; j++){
                    snippet = data.snippets[data.snippetGroups[i].snippets[j]];
                    html += "<option value=\"" + data.snippetGroups[i].snippets[j] + "\">" + snippet.description + "</option>";
                }
                html += "</optgroup>";
            }
            html += "</select>";
            selectHTML = html;
        }).fail(function(a,b,c){console.log(a,b,c);});
    }
    function loadSnippet(){
        var snippet,code,selected = $("#snippets option:selected")[0],params;
        if(selected.value.length > 0){
            snippet = dataSnippets.snippets[selected.value];
            code = snippet.code.join("\n") + "\n";
            params = code.match(Espruino.General.pinRegExp);
            if(params !== null) {Espruino.General.replaceParams(code,params);}
            else{Espruino.General.setEditorCode(code);}                     
        }
        $(".subform").hide();
    }
})();
