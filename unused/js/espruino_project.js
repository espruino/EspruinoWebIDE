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
  
  // <button class="project" style="position:absolute;right:30px;top:2px;">Project</button>
  // <span id="projectName" style="position:absolute;right:56px;top:2px;">&nbsp;</span>
    // Code to load and save project
    Espruino["Project"] = {};
    Espruino.Project.projectActive = false;
    Espruino.Project.projectPathEntry = null;
    Espruino.Project.projectModuleLoading = "localFirst";
    var actualProject, terminalSnippets = {};
    Espruino.Project.init = function() { 
      switchProject();
    }; 
    Espruino.Options.initOptions = function(){
      Espruino.Options.optionFields.push({id:"#projectActive",module:"Project",field:"projectActive",type:"check",onLoaded:switchProject,onBlur:true});
      Espruino.Options.optionFields.push({id:"#projectPathEntry",module:"Project",field:"projectPathEntry",type:"directory",divObject:"projectPath",onBlur:true});
      Espruino.Options.optionFields.push({id:"#projectModuleLoading",module:"Project",field:"projectModuleLoading",type:"select",options:["espruino","local","espruinoFirst","localFirst"],onBlur:true});
      Espruino.Options.optionBlocks.push({module:"Project",buttonLine:2,onForm:initPath,onLoaded:getProjectSnippets});
    };
    function initPath(){
      if(Espruino.Project.projectPathEntry){
        chrome.fileSystem.isRestorable(Espruino.Project.projectPathEntry, function(bIsRestorable){
          chrome.fileSystem.restoreEntry(Espruino.Project.projectPathEntry, function(theEntry) {
            if(theEntry){
              chrome.fileSystem.getDisplayPath(theEntry,function(path) { 
                $("#projectPath").html(path);
              });
            }
            else{Espruino.Core.Notifications.error("Project not found");}
          }); 
        });
      }
      $(".projectPathButton").unbind().click(assignPath);
    } 
    function assignPath(evt){
      chrome.fileSystem.chooseEntry({type: 'openDirectory'}, function(theEntry) {
        if(theEntry){
          chrome.fileSystem.getDisplayPath(theEntry,function(path) {
            $("#projectPath").html(path);
            $("#projectPathEntry").val(chrome.fileSystem.retainEntry(theEntry));
            Espruino.Project.projectPathEntry = chrome.fileSystem.retainEntry(theEntry);
            var dirReader = theEntry.createReader();
            var entries = [];
            dirReader.readEntries (function(results) {
              if(!checkSubFolder(results,"modules")){ theEntry.getDirectory("modules", {create: true}); }
              if(!checkSubFolder(results,"projects")){ theEntry.getDirectory("projects", {create:true}); } 
              if(!checkSubFolder(results,"firmware")){ theEntry.getDirectory("firmware", {create:true}); }
              if(!checkSubFolder(results,"snippets")){ theEntry.getDirectory("snippets", {create:true}); }
            });
          });
        }
      });
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
    function switchProject(){
      if(Espruino.Project.projectActive){
        $(".project").button({ text: false, icons: { primary: "ui-icon-suitcase" } }).show();
        $(".project").click(showForm);
        $("#terminal").on("contextmenu",showSnippets);
      }
      else{
        $(".project").unbind().hide();
        $("#terminal").unbind("contextmenu");
      }
    }
    function showSnippets(evt){
      if(Espruino.Serial.isConnected()){
        var html = "<ul>";
        evt.preventDefault();
        for(var i in terminalSnippets){
          html += '<li class="terminalSnippet">' + i + '</li>';
        }
        html += '</ul>';
        Espruino.General.ShowSubForm("terminalSnippets",evt.pageY,evt.pageX,html,"#cff","body");
        $(".terminalSnippet").click(sendSnippets)
      }
      function sendSnippets(evt){
        Espruino.Serial.write(terminalSnippets[$(this).html()] + "\n");
        $("#terminalSnippets").remove();
      }
    }
    function showForm(){
      var html = "";
      getProjectModules(showFullForm);
      function showFullForm(html){
        html += '<div id="modulSource" style="height:400px; overflow-y:scroll"></div>'; 
        Espruino.General.ShowSubForm("divProject",30,300,html,"#8CF","body");
        $(".saveProject").button({ text: false, icons: { primary: "ui-icon-disk" } }).click(projectSave);
        $(".saveAsProject").button({ text:false, icons: { primary: "ui-icon-plusthick"} }).click(projectSaveAs);
        $(".projectModules").click(showModule);
        $(".projectProjects").click(setProject);
      }
    }
    function projectSave(evt){
      actualProject.createWriter(function(fileWriter){
        var bb = new Blob([Espruino.codeEditor.getValue()],{type:'text/plain'});
        fileWriter.truncate(bb.size);
        setTimeout(function(evt){
          fileWriter.seek(0);
          fileWriter.write(bb);
          Espruino.Core.Notifications.success("Project saved");
        },200);
      });
      $(".subform").hide();
    }
    function gotFullCode(data){
      console.log(data);
    }
    function projectSaveAs(evt){
      getProjectSubDir("projects",function(subDirEntry){
        checkFileExists(subDirEntry,$("#saveAsName").val(),fileExists,fileNotExisting);
        function fileNotExisting(){
          subDirEntry.getFile($("#saveAsName").val(),{create:true},function(fileEntry){
            actualProject = fileEntry;
            fileEntry.createWriter(function(fileWriter){
              var bb = new Blob([Espruino.codeEditor.getValue()],{type:'text/plain'});
              fileWriter.write(bb);
              Espruino.Core.Notifications.success("new Project");
              $("#projectName").html(fileEntry.name);
            });
          });
        }
        function fileExists(fileEntry){Espruino.Core.Notifications.error("File already exists");}
      });
      $(".subform").hide();
    }
    function setProject(evt){
      checkEntry($(this).attr("fileentry"),openProject);
      function openProject(theEntry){
        actualProject = theEntry;
        $("#projectName").html(theEntry.name);
        readFilefromEntry(theEntry,copySource);
        function copySource(data){
          Espruino.General.setEditorCode(data);
          $(".subform").hide();
        }
      }
    }
    function showModule(evt){
      checkEntry($(this).attr("fileentry"), showSource);
      function showSource(theEntry){
        readFilefromEntry(theEntry,setSource);
        function setSource(data){
          var html = "<b>" + theEntry.name + "</b><hr>";
          html += data.replace(/\n/g,"<br>");
          $("#modulSource").html(html);
        }
      }
    }
    function getProjectSnippets(){
      if(Espruino.Project.projectPathEntry){
        getProjectSubDir("snippets",function(subDirEntry){
          checkFileExists(subDirEntry,"terminalsnippets.txt",function(fileEntry){
            readFilefromEntry(fileEntry,function(data){
              terminalSnippets = JSON.parse(data);
            });
          });
        });
      }      
    }
    function getProjectModules(callback){
      var html = "";
      getProjectSubDir("modules",getModules);
      function getModules(subDirEntry){
        var dirReader = subDirEntry.createReader();
        dirReader.readEntries(function(results){
          html += '<ul><b>Project modules</b>';
          for(var i = 0; i < results.length; i++){
            if(!results[i].isDirectory){
              html += '<li class="projectModules" fileEntry="' + chrome.fileSystem.retainEntry(results[i]) + '">' + results[i].name + '</li>';              
            }
          }  
          html += "</ul>";
          getProjectProjects(html,callback);
        });
      }
    }
    function getProjectProjects(html,callback){
      getProjectSubDir("projects",getProjects);
      function getProjects(subDirEntry){
        var dirReader = subDirEntry.createReader();
        dirReader.readEntries(function(results){
          var span;
          html += '<hr><ul><b>Projects</b>';
          for(var i = 0; i < results.length; i++){
            if(!results[i].isDirectory){
              span = '<span class="projectProjects" fileEntry="' + chrome.fileSystem.retainEntry(results[i]) + '">' + results[i].name + '</span>';
              html += '<li>';
              if(actualProject){
                if(actualProject.name === results[i].name){ 
                  html += '<b><i>' + span + '</i></b>';
                  html += '<button class="saveProject">Save</button>';
                }
                else{ html += span; }
              }
              else{ html += span; }
              html += '</li>';
            }
          }
          html += '</ul>';
          html += '<input type="text" value="newProject.js" id="saveAsName"/> <button class="saveAsProject">Save as</button>';
          callback(html);
        });
      }
    }
    function getProjectSubDir(name,callback){
      checkEntry(Espruino.Project.projectPathEntry,getSubTree);
      function getSubTree(entry){
        var dirReader = entry.createReader();
        dirReader.readEntries (function(results) {
          for(var i = 0; i < results.length; i++){
            if(results[i].name === name){
              callback(results[i]);
              return;
            }
          }
          callback(false);
        });
      }
    }
    function checkEntry(entry,callback){
      if(entry){
        chrome.fileSystem.isRestorable(entry, function(bIsRestorable){
          chrome.fileSystem.restoreEntry(entry, function(theEntry) { 
            if(theEntry){ callback(theEntry);}
            else{Espruino.Core.Notifications.error("Project not found");}
          });
        });
      }
    }
    function checkFileExists(dirEntry,fileName,existsCallback,notExistsCallback){
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
        if(!fnd){notExistsCallback();}
      });
    }
    function readFilefromEntry(entry,callback){
      var reader = new FileReader();
      reader.onload = function(e){ callback(e.target.result);}
      entry.file(function(file){ reader.readAsText(file);});
    }
    function readBinaryArrayfromEntry(entry,callback){
      var reader = new FileReader();
      reader.onload = function(e){callback("",e.target.result);}
      entry.file(function(file){ reader.readAsArrayBuffer(file);});
    }
    Espruino.Project.readFirmware = function(firmwareName,callback){
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
          if(!fnd){callback("Error Reading firmware");}
        });
      }
    }
    Espruino.Project.readModule = function(url,modulName,callback){
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
    Espruino.Project.getModuleSequence = function(standardCall){
      var sequence = [];
      if(Espruino.Project.projectActive === true){
        if(Espruino.Project.projectPathEntry){
          switch(Espruino.Project.projectModuleLoading){
            case "local":
              sequence.push(Espruino.Project.readModule);
              break;
            case "Espruino":
              sequence.push(standardCall);
              break;
            case "localFirst":
              sequence.push(Espruino.Project.readModule);
              sequence.push(standardCall);
              break;
            case "espruinoFirst":
              sequence.push(standardCall);
              sequence.push(Espruino.Project.readModule);
              break;
          }
        }
        else{sequence.push(standardCall);}
      }
      else{sequence.push(standardCall);}
      return sequence;
    }
})();
