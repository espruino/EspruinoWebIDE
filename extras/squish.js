#!/usr/bin/node
/*

Read an html file and concatenate all js and css files together.

Service workers are rubbish at loading files, so the IDE is super 
slow. We need to merge everything together - minification is less
of a big deal that ~100 separate HTTP requests going via the SW.

Yes, I could use Grunt or something, but this 'just works'.
 
*/

var inputFile, outputFile;
var deleteSquished = false;
var argumentError = false;

for (var i=2;i<process.argv.length;i++) {
  var arg = process.argv[i];
  if (arg[0]=="-") {
    if (arg=="--delete-squished") {
      deleteSquished = true;
    } else {
      console.log("Unknown argument ",arg);
      argumentError = true;
    } 
  } else {
    if (!inputFile) inputFile = arg;
    else if (!outputFile) outputFile = arg;
    else {
      console.log("Too many filenames supplied ",arg);
      argumentError = true;
    }
  }
}

if (argumentError || !inputFile || !outputFile) {
  console.log(
    "--== SQUISH ==--\n"+
    "USAGE: node squish.js from.html to.html\n"+
    "\n"+
    "Optional Arguments:\n"+
    "  --delete-squished  - delete any JS or CSS files that are merged\n"
  );  
  process.exit(1);
}


var fs = require("fs");
processHTML(inputFile, outputFile);


function processHTML(infile, outfile) {
  var squishedFiles = [];
  console.log("Squishing "+infile+" to "+outfile);
  var baseName = infile.substr(0, infile.lastIndexOf("."));
  if (baseName.indexOf("/")>=0) baseName=baseName.substring(baseName.lastIndexOf("/")+1);
  var baseDirIn = (infile.indexOf(".")>=0) ? infile.substr(0, infile.lastIndexOf("/")+1) : "";
  var baseDirOut = (outfile.indexOf(".")>=0) ? outfile.substr(0, outfile.lastIndexOf("/")+1) : "";
  console.log("Input directory "+baseDirIn);
  console.log("Output directory "+baseDirOut);
  console.log("Base name "+baseName);
  var html = fs.readFileSync(infile).toString();

  var match, firstMatch;
  
  // ================================================ CSS
  firstMatch = 0;
  var css = "";
  var recss = /<link\s*rel="stylesheet"\s*href="([^"]*)"\s*\/>\s*/;
  while ((match = recss.exec(html))!==null) {
    if (!firstMatch) firstMatch=match.index;
    var len = match[0].length;
    var cssfilename = match[1];
    var dir = (cssfilename.indexOf("/")>=0)?cssfilename.substr(0,cssfilename.lastIndexOf("/")+1):"";
    console.log("loading "+cssfilename);
    css += "/* --------------------------------------------------------------\n";
    css += "         "+cssfilename+"\n";
    css += "   -------------------------------------------------------------- */\n";
    if (cssfilename[0]!="/") cssfilename=baseDirIn+cssfilename;
    var csscontents = fs.readFileSync(cssfilename).toString().trim()+"\n";
    squishedFiles.push(cssfilename);
    csscontents = csscontents.replace(/url\(([^\)]*)\)/g, function(fullmatch,url) {
      if (url[0]=="\"") url=url.slice(1,-1);
      if (url.substr(0,5)=="data:") return fullmatch; // don't replace
      console.log("URL replace "+url);
      return "url("+dir+url+")";
    });
    css += csscontents;
    html = html.substr(0,match.index)+html.substr(match.index+len);
  }  
  
  if (css.length) {     
    var cssfilename = baseName+".css";
    console.log("Writing CSS to "+baseDirOut+cssfilename);
    fs.writeFileSync(baseDirOut+cssfilename, css);
    html = html.substr(0,firstMatch)+
           '<link rel="stylesheet" href="'+cssfilename+'"/>\n'+
           html.substr(firstMatch);
  }
  // ================================================ JS
  firstMatch = 0;
  var js = "";
  var rejs = /<script\s*src="([^"]*)"\s*><\/script>\s*/;
  while ((match = rejs.exec(html))!==null) {
    if (!firstMatch) firstMatch=match.index;
    var len = match[0].length;
    var jsfilename = match[1];
    console.log("loading "+jsfilename);
    js += "/* --------------------------------------------------------------\n";
    js += "         "+jsfilename+"\n";
    js += "   -------------------------------------------------------------- */\n";
    if (jsfilename[0]!="/") jsfilename=baseDirIn+jsfilename;
    js += fs.readFileSync(jsfilename).toString().trim()+"\n";
    squishedFiles.push(jsfilename);
    html = html.substr(0,match.index)+html.substr(match.index+len);
  }  

  if (js.length) {  
    var jsfilename = baseName+".js";
    console.log("Writing JS to "+baseDirOut+jsfilename);
    fs.writeFileSync(baseDirOut+jsfilename, js);
    html = html.substr(0,firstMatch)+
           '<script src="'+jsfilename+'"></script>\n'+
           html.substr(firstMatch);
  }    
  
  fs.writeFileSync(outfile, html);
  console.log("Success!");
  if (deleteSquished && squishedFiles.length) {
    console.log("Deleting used files");
    squishedFiles.forEach(function(fn) {
      console.log("Deleting",fn);
      fs.unlinkSync(fn);
      var minfn;
      if (fn.indexOf(".min.js")>=0) minfn = fn.substr(0,fn.indexOf(".min.js"))+".js";
      if (fn.indexOf(".min.css")>=0) minfn = fn.substr(0,fn.indexOf(".min.css"))+".css";
      if (fn.indexOf(".js")>=0) minfn = fn.substr(0,fn.indexOf(".js"))+".min.js";
      if (fn.indexOf(".css")>=0) minfn = fn.substr(0,fn.indexOf(".css"))+".min.css";
      if (minfn && fs.existsSync(minfn)) {
        console.log(" - deleting minified/unminified variant",minfn);
        fs.unlinkSync(minfn);
      }
      var folder = fn.substr(0,fn.lastIndexOf("/"));
      while (folder && 
             fs.statSync(folder).isDirectory() &&
             fs.readdirSync(folder).length==0) {
        console.log("Removing directory "+folder);
        fs.rmdirSync(folder);
        folder = folder.substr(0,folder.lastIndexOf("/"));
      }
    });
  }
}
