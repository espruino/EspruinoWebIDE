/**
 Copyright 2014,2015 Juergen Marsch (juergenmarsch@googlemail.com)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Local Project handling Plugin
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  var iconFolder,iconSnippet,actualProject = "";
  var snippets = JSON.parse('{ "Reset":"reset();","Memory":"process.memory();","ClearInterval":"clearInterval();"}');
  function init() {
    Espruino.Core.Config.addSection("Project", {
      sortOrder:500,
      description: "Local directory used for projects, modules, etc. When you select a directory, the 'Projects' and 'Snippets' icons will appear in the main window.",
      tours: { "Project Tour":"project.json", "Snippets Tour":"projectSnippet.json" },
      getHTML : function(callback) { 
        var html =
                '<div id="projectFolder" style="width:100%;border:1px solid #BBB;margin-bottom:10px;"></div>'+
                '<button class="projectButton">Select Directory for Sandbox</button>';
        callback(html);
        setTimeout(function(){
          showLocalFolder();
          setSandboxButton(); // make the 'Select Directory' button do something
        },10);
      }
    });
 
    Espruino.addProcessor("getModule", function (module, callback) {
      getProjectSubDir("modules",getModules);
      var t = setTimeout(function(){callback(module);},500);
      function getModules(subDirEntry){
        var fnd = false;
        var dirReader = subDirEntry.createReader();
        dirReader.readEntries(function(results){
          for(var i = 0; i < results.length; i++){
            if(results[i].name === module.moduleName + ".js"){
              fnd = true;
              readFilefromEntry(results[i],gotModule);
              break;
            }
          }
          if(!fnd){callback(module);}
        });
      }
      function gotModule(data){
        clearTimeout(t);
        module.moduleCode = data;
        callback(module);
      }
    });
    Espruino.addProcessor("transformForEspruino", function(code, callback) {
      findBinary(code,callback);
    });
    Espruino.addProcessor("getBinary",function(option,callback){
      getProjectSubDir("binary",function(dirEntry){
        checkFileExists(
          dirEntry,
          option.binary.binary + ".BIN",
          function(fileEntry){
            readBinaryArrayfromEntry(
              fileEntry,
              function(data){
                option.binaryCode = data;
                callback(option);
              }
            );
          },
          function(){
            callback(option);
          }                    
        );
      });
    });
    Espruino.addProcessor("getFirmware",function(url,callback){ loadFirmware(url,callback);});
    Espruino.addProcessor("initialised",function(){
      if(Espruino.Config.projectEntry){ 
        chrome.fileSystem.isRestorable(Espruino.Config.projectEntry,function(bisRestorable){
          if(!bisRestorable){ Espruino.Config.Notifications.warning("Sandbox not valid anymore");}
          else{ checkEntry(Espruino.Config.projectEntry,function(theEntry){ updateProjectFolder(theEntry);});}
        });
      }
    });
    setTimeout(function(){
      getProjectSnippets();          
    },10);
    showIcon(Espruino.Config.projectEntry); 
  }
  function findBinary(code,callback){ // find it in E.asmBinary(FunctionName,format,asmFunction);
    var binary = {},binarys = [];
    var lex = Espruino.Core.Utils.getLexer(code);
    var tok = lex.next();
    var state = 0;
    var startIndex = -1;
    while (tok!==undefined) {
      if (state==0 && tok.str=="E") { state=1; binary={}; binary.start = tok.startIdx; tok = lex.next();}
      else if (state==1 && tok.str==".") { state=2; tok = lex.next();}
      else if (state==2 && (tok.str=="asmBinary")) { state=3; tok = lex.next();}
      else if (state==3 && (tok.str=="(")) { state=4; tok = lex.next();}
      else if (state==4){ binary.variable = tok.value; state=5; tok = lex.next();}
      else if (state==5 && (tok.str==",")) { state=6; tok = lex.next();}
      else if (state==6){ binary.format = tok.value; state=7; tok = lex.next();}
      else if (state==7 && (tok.str==",")) {state=8; tok = lex.next();}
      else if (state==8 && tok.str){
        state=0;
        binary.binary = tok.value;
        binary.token = code.substring(binary.start,tok.endIdx + 1);
        binarys.push(binary);
      }
      else{
        state = 0;
        tok = lex.next();
      }
    }
    if(binarys.length === 0){ callback(code);}
    replaceAllBinaries(code,binarys,callback);
  }
  function replaceAllBinaries(code,binarys,callback){
    var i = 0;
    replaceBinary(binarys[i]);
    function replaceBinary(binary){
      Espruino.callProcessor(
        "getBinary",
        { binary: binary, binaryCode:undefined},
        function(data){
          if(data.binaryCode){
            var asm = "if(!ASM_BASE){ASM_BASE = process.memory().stackEndAddress;}\n";
            asm += "ASM_BASE_" + data.binary.variable + " = ASM_BASE + 1;\n[";
            var bufView=new Uint8Array(data.binaryCode);
            for(var j = 0;j < bufView.length; j+=2){
              asm += "0x" + int2Hex(bufView[j + 1]) + int2Hex(bufView[j]) + ",";
            }
            asm = asm.substr(0,asm.length - 1) + "].forEach(function(v)";
            asm += "{ poke16((ASM_BASE+=2)-2,v); });\n";
            asm += "var " + data.binary.variable  + " = E.nativeCall(ASM_BASE_" + data.binary.variable + ",\"" + data.binary.format + "\")";
            code = code.replace(data.binary.token,asm);
          }
          i++;
          if(i >= binarys.length){ callback(code);}else{replaceBinary(binarys[i]);}
        }
      );
    }     
  }
  function int2Hex(u){
    var l = u.toString(16);
    if(l.length === 1){ l = "0" +l; }
    return l;
  }
  function sendSnippets(evt){
    Espruino.Core.Serial.write(snippets[$(this).html()] + "\n");
    Espruino.Core.App.closePopup();
    $("#terminalfocus").focus();
  }
  function checkSubFolder(entries,subDirName){
    var r = false;
    for(var i = 0; i < entries.length; i++){
      if(entries[i].isDirectory){
        if(entries[i].name === subDirName){ r = true;break;}
      }
    }
    return r;
  }      
  function updateProjectFolder(theEntry){
    var dirReader = theEntry.createReader();
    var entries = [];
    dirReader.readEntries (function(results) {
      if(!checkSubFolder(results,"binary")){ theEntry.getDirectory("binary", {create:true}); }
      if(!checkSubFolder(results,"firmware")){ theEntry.getDirectory("firmware", {create:true}); }
      if(!checkSubFolder(results,"modules")){ theEntry.getDirectory("modules", {create: true}); }
      if(!checkSubFolder(results,"projects")){ theEntry.getDirectory("projects", {create:true}); } 
      if(!checkSubFolder(results,"snippets")){ theEntry.getDirectory("snippets", {create:true}); saveSnippets(); }
      if(!checkSubFolder(results,"testing")){ theEntry.getDirectory("testing", {create:true}); }
      if(!checkSubFolder(results,"testinglog")){ theEntry.getDirectory("testinglog", {create: true}); }    });  
  }
  function setSandboxButton(){
    $(".projectButton").click(function(evt){
      chrome.fileSystem.chooseEntry({type: 'openDirectory'}, function(theEntry) {
        if(theEntry){
          chrome.fileSystem.getDisplayPath(theEntry,function(path) {            
            $("#projectEntry").val(chrome.fileSystem.retainEntry(theEntry));
            Espruino.Config.set("projectEntry",chrome.fileSystem.retainEntry(theEntry));
            showLocalFolder(); // update text box + icon
            updateProjectFolder(theEntry);
          });
        } else {
          // user cancelled
          Espruino.Config.set("projectEntry",""); // clear project entry
          showLocalFolder(); // update text box + icon
        }
      }); 
    });
  }
  function showLocalFolder(){
    // set whether we show the project icon or not
    showIcon(Espruino.Config.projectEntry);
    // update the project folder text box
    $("#projectFolder").html("&nbsp;");
    if(Espruino.Config.projectEntry){
      chrome.fileSystem.isRestorable(Espruino.Config.projectEntry, function(bIsRestorable){
        chrome.fileSystem.restoreEntry(Espruino.Config.projectEntry, function(theEntry) {
          if(theEntry){
            chrome.fileSystem.getDisplayPath(theEntry,function(path) { 
              $("#projectFolder").text(path);
            });
          }
          else{Espruino.Core.Status.setStatus("Project not found");}
        }); 
      });
    } 
  }
  function getProjectSnippets(){
    if(Espruino.Config.projectEntry){
      getProjectSubDir("snippets",function(subDirEntry){
        checkFileExists(subDirEntry,"terminalsnippets.txt",function(fileEntry){
          readFilefromEntry(fileEntry,function(data){
            snippets = JSON.parse(data);
          });
        });
      });
    }      
  }
  function getProjectSubDir(name,callback){
    checkEntry(Espruino.Config.projectEntry,getSubTree);
    function getSubTree(entry){
      var dirReader = entry.createReader();
      dirReader.readEntries (function(results) {
        for(var i = 0; i < results.length; i++){
          if(results[i].name === name){
            callback(results[i]);
            return;
          }
        }
        console.warn("getProjectSubDir("+name+") failed");
        callback(false);
      });
    }
  }
  function checkEntry(entry,callback){
    if(entry){
      chrome.fileSystem.isRestorable(entry, function(bIsRestorable){
        chrome.fileSystem.restoreEntry(entry, function(theEntry) { 
          if(theEntry){ callback(theEntry);}
          else{Espruino.Status.setError("Project not found");}
        });
      });
    }
  }
  function checkFileExists(dirEntry,fileName,existsCallback,notExistsCallback){
    if (!dirEntry) {
      if (notExistsCallback)notExistsCallback();
      return;
    }
      
    var dirReader = dirEntry.createReader();
    dirReader.readEntries(function(results){
      var fnd = false;
      for(var i = 0;i < results.length; i++){
        if(results[i].name === fileName){
          existsCallback(results[i]);
          fnd = true;
          break;
        }
      }
      if(!fnd && notExistsCallback){notExistsCallback();}
    });
  }
  function readFilefromEntry(entry,callback){
    var reader = new FileReader();
    reader.onload = function(e){ callback(e.target.result);};
    entry.file(function(file){ reader.readAsText(file);});
  }
  function readDataUrlfromEntry(entry,callback){
    var reader = new FileReader();
    reader.onloadend = function(e){callback(e.target.result);};
    entry.file(function(file){reader.readAsDataURL(file);});
  }
  function saveFileAs(dirEntry,fileName,data){
    dirEntry.getFile(fileName,{create:true},function(fileEntry){
      actualProject = fileEntry;
      fileEntry.createWriter(function(fileWriter){
        var bb = new Blob([data],{type:'text/plain'});
        fileWriter.truncate(bb.size);
        setTimeout(function(evt){
          fileWriter.seek(0);
          fileWriter.write(bb);          
        },200);
      });
    });
  }
  function getProject(html,callback){
    if(Espruino.Config.projectEntry){
      html += '<div id="tabs">';
      html += '<ul><li><a href="#p">Projects</a></li>';
      html += '<li><a href="#m">Modules</a></li>';
      html += '<li><a href="#b">Binaries</a></li>';
      html += '<li><a href="#s">Snippets</a></li></ul>';
      getProjects(html,function(html){
        getModules(html,function(html){
          getBinaries(html,function(html){
            getSnippets(html,function(html){
              html += '</div>';
              callback(html);                
            });
          });
        });
      });
    }
    else{
      html += 'Sandbox not assigned<br>Open options and click Sandbox';
      callback(html);
    }
  }
  function copy2SD(path,data){
    var src,i,y;
    if(Espruino.Core.Serial.isConnected()){
      src = 'echo(0);\n;';
      src += 'var fs = require("fs");fs.unlink("' + path + '");';
      Espruino.Core.Serial.write(src);
      for(i = 0; i <= data.length / 256;i++){
        y = new Uint8Array(data.buffer,i * 256,Math.min(data.length - i*256,256));
        if(i === 0){ src = 'fs.writeFile';} else{ src='fs.appendFile';}
        if(typeof data === "string"){
          src += '("' + path + '","' + btoa(y) + '");\n';
        }
        else{
          src += '("' + path + '",atob("' + btoa(String.fromCharCode.apply(null,y)) + '"));\n';
        }
        Espruino.Core.Serial.write(src);
      }
      src = 'echo(1);\n\n';
      Espruino.Core.Serial.write(src);
      Espruino.Core.App.closePopup();
      $("#terminalfocus").focus();
    }
    else{
      Espruino.Core.Notifications.error("Not Connected");
    }
  }
  function getSnippets(html,callback){
    html += '<div id="s">' + getSnippetTable() + '</div>';
    callback(html);
  }
  function getSnippetTable(){
    var i,j,html = "";  
    html += '<table width="100%">';
    j = 0;
    for(i in snippets){
      html += '<tr><th>' + i + '</th><th>' + snippets[i] + '</th>';
      html += '<th title="drop snippet"><button snippet="' + i + '" class="dropSnippet"></button></th></tr>';
      j++;
    }
    html += '<tr><th><input type="text" size="10" id="newSnippetName" value="snippet' + j.toString() + '"></th><th>';
    html += '<input type="text" id="newSnippetValue" value="console.log();"></th>';
    html += '<th><button class="addSnippet">Add Snippet</button></th></tr>';
    html += '</table>';
    return html;
  }
  function getProjectTable(html,subDir,ext,header,row,footer,callback){
    getProjectSubDir(subDir,gotSubDir);
    function gotSubDir(subDirEntry){
      var name,lhtml,lrow,dirReader = subDirEntry.createReader();
      dirReader.readEntries(function(results){
        lhtml = header;
        for(var i = 0; i < results.length;i++){
          if(!results[i].isDirectory){
            name = results[i].name.split(".");
            if(name.length > 0){
              if(name[1].toUpperCase() === ext){
                lrow = row.replace("$name0",name[0]);
                lrow = lrow.replace("$fileentry",chrome.fileSystem.retainEntry(results[i]));
                lrow = lrow.replace("$name",results[i].name);
                lhtml += lrow;
              }
            }
          }
        }
        lhtml += footer;
        callback(html + lhtml);        
      });
    }
  }
  function getModules(html,callback){
    var header,row,footer;
    header = '<div id="m"><table width="100%">';
    row = '<tr><th>$name0</th>';
    row += '<th title="copy to SD"><button class="copyModule" fileentry="$fileentry"';
    row += ' filename="$name"></button></th></tr>';
    footer = '</table></div>';
    getProjectTable(html,"modules","JS",header,row,footer,callback);
  }
  function copyModule(){  console.log($(this));
    var fileName = $(this).attr("filename");
    checkEntry($(this).attr("fileentry"),function(theEntry){
      readFilefromEntry(theEntry,function(data){
        copy2SD("node_modules/" + fileName,data);         
      });
    });    
  }
  function getBinaries(html,callback){
    var header,row,footer;
    header = '<div id="b"><table width="100%"><tr><th align="center"><i>Binaries</i></th></tr>';
    row = '<tr><th>$name0</th>';
    row += '<th title="copy to SD"><button class="copyBinary" fileentry="$fileentry"';
    row += ' filename="$name"></button></th></tr>';
    footer = '';   
    getProjectTable(html,"binary","BIN",header,row,footer,getBinariesImage);
    function getBinariesImage(html){
      var header,row,footer;
      header = '<tr><th colspan="2" align="center"><i>bmp files</i></th></tr>';
      row = '<tr><th>$name0</th>';
      row += '<th title="copy to SD"><button class="copyBinary" fileentry="$fileentry"';
      row += ' filename="$name"></button></th></tr>';
      footer = '</table></div>';
      getProjectTable(html,"binary","BMP",header,row,footer,callback);
    }
  }
  function copyBinary(){
    var fileName = $(this).attr("filename");
    checkEntry($(this).attr("fileentry"),function(theEntry){
      readBinaryArrayfromEntry(theEntry,function(data){
        var u = new Uint8Array(data);
        copy2SD("node_binaries/" + fileName,u);
      });  
    });
  }
  function copyImage(){
    var fileName = $(this).attr("filename");
    checkEntry($(this).attr("fileentry"),function(theEntry){
      readBinaryArrayfromEntry(theEntry,function(data){
        var u = new Uint8Array(data);
        copy2SD("images/" + fileName,u);
      });  
    });    
  }
  function getProjects(html,callback){
    getProjectSubDir("projects",function(subDirEntry){
      var name,dirReader = subDirEntry.createReader();
      dirReader.readEntries(function(results){
        var attrFileEntry;
        html += '<div id="p">';
        html += '<table width="100%">';
        for(var i = 0; i < results.length; i++){
          if(!results[i].isDirectory){
            name = results[i].name.split(".");
            if(name[1] === "js"){
              attrFileEntry = 'fileEntry="' + chrome.fileSystem.retainEntry(results[i]) + '"';
              html += '<tr><th>' + name[0] + '</th>';
              if(actualProject){
                if(actualProject.name === results[i].name){ 
                  html += '<th>&nbsp;</th><th title="save Project"><button class="saveProject"></button>';
                }
                else{ html += '<th title="load into Editor"><button class="loadProjects"' + attrFileEntry + '></button>'; }
              }
              else{ html += '<th title="load into Editor"><button class="loadProjects"' + attrFileEntry + '></button>'; }
              html += '</th></tr>';
            }
          }
        }
        html += '</table>';
        html += '<input type="text" value="newProject.js" id="saveAsName"/> <button class="saveAsProject">Save as</button>';
        html += '</div>';
        callback(html);
      });
    });
  }
  function projectSave(){
    actualProject.createWriter(function(fileWriter){
      var bb = new Blob([Espruino.Core.EditorJavaScript.getCode()],{type:'text/plain'});
      fileWriter.truncate(bb.size);
      setTimeout(function(evt){
        fileWriter.seek(0);
        fileWriter.write(bb);
      },200);
    });
    Espruino.Core.App.closePopup();
  }
  function projectSaveAs(){
    getProjectSubDir("projects",function(dirEntry){
      saveFileAs(dirEntry,$("#saveAsName").val(),Espruino.Core.EditorJavaScript.getCode());
      Espruino.Core.App.closePopup();
    });
  }
  function dropSnippet(){
    var i,snp = {};
    var snippet = $(this).attr("snippet");
    for(i in snippets){
      if(i !== snippet){
        snp[i] = snippets[i];
      }
    }
    snippets = snp;
    $("#s").html(getSnippetTable());
    saveSnippets();
    Espruino.Core.App.closePopup();
  }
  function addSnippet(){
    snippets[$("#newSnippetName").val()] = $("#newSnippetValue").val();
    $("#s").html(getSnippetTable());
    saveSnippets();
    Espruino.Core.App.closePopup();
  }
  function saveSnippets(){
    if(Espruino.Config.projectEntry){
      getProjectSubDir("snippets",function(subDirEntry){
        if (!subDirEntry) return;
        checkFileExists(subDirEntry,"terminalsnippets.txt",
          function(fileEntry){
            fileEntry.createWriter(function(fileWriter){
              var bb = new Blob([JSON.stringify(snippets)],{type:'text/plain'});
              fileWriter.truncate(bb.size);
              setTimeout(function(evt){
                fileWriter.seek(0);
                fileWriter.write(bb);
              },200);
            });
          },
          function(){
            setTimeout(function(){                    
              getProjectSubDir("snippets",function(dirEntry){
                if (!dirEntry) return;
                saveFileAs(dirEntry,"terminalsnippets.txt",JSON.stringify(snippets));
              });
            },50);
          }
        );
      });
    }
  }
  function loadProject(){
    checkEntry($(this).attr("fileentry"),openProject);
    function openProject(theEntry){
      actualProject = theEntry;
//$("#projectName").html(theEntry.name);
      readFilefromEntry(theEntry,copySource);
      function copySource(data){
        Espruino.Core.EditorJavaScript.setCode(data);
      }
    }
    Espruino.Core.App.closePopup();
  }
  function loadModule(localUrl,modulName,callback){
    //localUrl not used in this modul Loading
    getProjectSubDir("modules",getModules);
    function getModules(subDirEntry){
      var fnd = false;
      var dirReader = subDirEntry.createReader();
      dirReader.readEntries(function(results){
        for(var i = 0; i < results.length; i++){
          if(results[i].name === modulName + ".js"){
            fnd = true;
            readFilefromEntry(results[i],callback);
            break;
          }
        }
        if(!fnd){callback(false);}
      });
    }
  }
  function readBinaryArrayfromEntry(entry,callback){
    var reader = new FileReader();
    reader.onload = function(e){callback(e.target.result);};
    entry.file(function(file){ reader.readAsArrayBuffer(file);});
  }
  function loadFirmware(firmwareName,callback){
    getProjectSubDir("firmware",getFirmware);
    function getFirmware(subDirEntry){
      var fnd = false;
      var dirReader = subDirEntry.createReader();
      dirReader.readEntries(function(results){
        for(var i = 0; i < results.length; i++){
          if(results[i].name === firmwareName){
            fnd = true;
            readBinaryArrayfromEntry(results[i],callback);
            break;
          }
        }
        if(!fnd){callback();}
      });
    }
  }
  function loadFile(fileName,callback){
    var adr = fileName.split("/");
    getProjectSubDir(adr[0],getFile);
    function getFile(subDirEntry){
      checkFileExists(subDirEntry,adr[1],fileFound,fileNotFound);
    }
    function fileFound(theEntry){
      readFilefromEntry(theEntry,callback);
    }
    function fileNotFound(){
      Espruino.Core.Notifications.error("File '" + fileName + "' not found");
    }
  }
  function loadDataUrl(fileName,callback){
    var adr = fileName.split("/");
    getProjectSubDir(adr[0],getFile);
    function getFile(subDirEntry){ 
      checkFileExists(subDirEntry,adr[1],fileFound,fileNotFound);
    }
    function fileFound(theEntry){
      readDataUrlfromEntry(theEntry,callback);
    }
    function fileNotFound(){
      Espruino.Core.Notifications.error("File '" + fileName + "' not found");
    }
  }
  function saveFile(fileName,data){
    var adr = fileName.split("/");
    getProjectSubDir(adr[0],gotDir);
    function gotDir(subDirEntry){
      if(!subDirEntry){ Espruino.Core.Notifications.error("Project directory '" + adr[0] + "' is missing");}
      else{saveFileAs(subDirEntry,adr[1],data);}
    }
  }
  function loadDir(subDir,callback){
    getProjectSubDir(subDir,gotSubDir);
    function gotSubDir(subDirEntry){
      var dirReader = subDirEntry.createReader();
      dirReader.readEntries(function(results){
        callback(results);
      });
    }
  }
  function showIcon(newValue){
    if (iconFolder!==undefined) iconFolder.remove();
    if (iconSnippet!==undefined) iconSnippet.remove();
    iconFolder = undefined;
    iconSnippet = undefined;
    if(newValue){
      iconFolder = Espruino.Core.App.addIcon({
        id: 'openProjectFolder',icon: 'folder',title: 'Projects',order: 500,
        area: { name: "code",position: "top"},
        click: function(){
          getProject("",function(html){
            Espruino.Core.App.openPopup({
              position: "relative",title: "Projects",id: "projectsTab",contents: html
            });
            setTimeout(function(){
              $(".saveProject").button({ text: false, icons: { primary: "ui-icon-disk" } }).click(projectSave);
              $(".saveAsProject").button({ text:false, icons: { primary: "ui-icon-plusthick"} }).click(projectSaveAs);
              $(".copyBinary").button({ text:false, icons: { primary: "ui-icon-copy"} }).click(copyBinary);
              $(".copyImage").button({ text:false, icons:{ primary: "ui-icon-copy"} }).click(copyImage);
              $(".copyModule").button({ text:false, icons: { primary: "ui-icon-copy"} }).click(copyModule);
              $(".dropSnippet").button({ text:false, icons: {primary: "ui-icon-trash"}}).click(dropSnippet);
              $(".addSnippet").button({ text:false, icons: { primary: "ui-icon-plusthick"} }).click(addSnippet);
              $(".loadProjects").button({ text:false, icons: { primary: "ui-icon-script"} }).click(loadProject);
              $("#tabs").tabs();
            },50);
          });
        }
      });
      iconSnippet = Espruino.Core.App.addIcon({
        id:'terminalSnippets',icon: 'snippets',title: 'Snippets',order: 500,
        area: {name: "terminal",position: "top"},
        click: function(){
          var html = '<ul class="terminalSnippets">';
          for(var i in snippets){
            html += '<li class="terminalSnippet">' + i + '</li>';
          }
          html += '</ul>';
          Espruino.Core.App.openPopup({
            position: "relative",title: "Snippets",id: "snippetPopup",contents: html
          });
          $(".terminalSnippet").click(sendSnippets);
        }
      });        
    }
  }
  function appendFile(fileName,data){
    var adr = fileName.split("/");
    getProjectSubDir(adr[0],gotDir);
    function gotDir(subDirEntry){
      if(!subDirEntry){ Espruino.Core.Notifications.error("Project directory '" + adr[0] + "' is missing");}
      else{
        subDirEntry.getFile(adr[1],{create:true},function(fileEntry){
          fileEntry.createWriter(function(fileWriter){
            var bb = new Blob([data],{type:'text/plain'});
            setTimeout(function(evt){
              if(fileWriter.length === 0) fileWriter.seek(0); else fileWriter.seek(fileWriter.length - 1);
              fileWriter.write(bb);          
            },100);
          });
        });
      }
    }
  }
  
  Espruino.Plugins.Project = {
    init : init,
    
    loadModule: loadModule,
    loadFirmware: loadFirmware,
    loadFile: loadFile,
    loadDataUrl: loadDataUrl,
    saveFile: saveFile,
    appendFile: appendFile,
    loadDir: loadDir,
    loadDirHtml: getProjectTable
  };
}());