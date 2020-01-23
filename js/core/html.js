/**
 Copyright 2020 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  Utilities for HTML wrangling
 ------------------------------------------------------------------
**/
"use strict";
(function(){

  function init() {

  }

  function markdownToHTML(markdown) {
    var html = markdown;
    //console.log(JSON.stringify(html));
    html = html.replace(/([^\n]*)\n=====*\n/g, "<h1>$1</h1>"); // heading 1
    html = html.replace(/([^\n]*)\n-----*\n/g, "<h2>$1</h2>"); // heading 2
    html = html.replace(/\n\s*\n/g, "\n<br/><br/>\n"); // newlines
    html = html.replace(/\*\*(.*)\*\*/g, "<strong>$1</strong>"); // bold
    html = html.replace(/```(.*)```/g, "<span class=\"code\">$1</span>"); // code
    //console.log(JSON.stringify(html));
    return html;
  };

  /** Make an HTML table out of a simple key/value object */
  function htmlTable(obj) {
    var html = '<table>';
    for (var key in obj) {
      html += '<tr><th>'+Espruino.Core.Utils.escapeHTML(key)+'</th><td>'+Espruino.Core.Utils.escapeHTML(obj[key])+'</td></tr>';
    }
    return html + '</table>';
  }

  /* Return the HTML to display a loading indicator */
  function htmlLoading() {
    // <span class="spin-animation">&#x21bb;</span>
    return '<h2 class="list__no-results">Loading...</h2>';
  }

  // Convert a HTML element list to an array
  function domToArray(collection) {
    return [].slice.call(collection);
  }

  // turn the HTML string into an HTML element
  function domElement(str) {
    var div = document.createElement('div');
    div.innerHTML = str.trim();
    return div.firstChild;
  }

  /* Return the HTML to display a list.
     items is an array of { icon, title, description(optional), callback(optional), right:[{icon,title,callback}] } */
  function domList(items, options) {
    var domList = Espruino.Core.HTML.domElement('<ul class="list"></ul>');

    var itemAttribs = 'style="margin-bottom: 4px;"';

    items.forEach(function(item) {
      var domItem = Espruino.Core.HTML.domElement('<li class="list__item" '+itemAttribs+'></li>');
      var html = item.right ?
        ('<span style="padding:0px;position: relative;display: inline-block;width: 100%;"'):
        ('<a class="button '+(item.icon?"button--icon":"")+' button--wide"');
      html += ' title="'+ item.title +'" >';
      if (item.icon)
        html += '<i class="'+item.icon+' lrg button__icon"></i>';
      html += '<div class="list__item__name">'+ item.title+'</div>';
      if (item.description)
        html += '<div class="list__item__desc">' + item.description + '</div>';
      html += '</div>' + (item.right ? '</span>':'</a>');
      var domBtn = Espruino.Core.HTML.domElement(html);
      if (item.right)
        item.right.forEach(i=>{
          var e = Espruino.Core.HTML.domElement(
            '<a title="'+i.title+'" class="'+i.icon+' sml button__icon button list__itemicon-right" style="float: right;"></a>'
          );
          if (i.callback) e.addEventListener("click",function(e) {
            e.stopPropagation();
            i.callback(e);
          });
          domBtn.prepend(e);
        });

      domBtn.addEventListener('click',function(e) {
        e.stopPropagation();
        if (item.callback)
          item.callback(e);
      });
      domItem.append(domBtn);
      domList.append(domItem);
    });
    return domList;
  }

  Espruino.Core.HTML = {
      markdownToHTML : markdownToHTML,

      htmlTable : htmlTable,
      htmlLoading : htmlLoading,

      domToArray : domToArray,
      domElement : domElement,
      domList: domList
  };
}());
