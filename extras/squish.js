#!/usr/bin/node
/*

Read an html file and concatenate all js and css files together.

Service workers are rubbish at loading files, so the IDE is super 
slow. We need to merge everything together - minification is less
of a big deal that ~100 separate HTTP requests going via the SW.

Yes, I could use Grunt or something, but this 'just works'.
 
*/

var fs = require("fs");
if (process.argv.length!=4) {
  console.log(
    "--== SQUISH ==--\n"+
    "USAGE: node squish.js from.html to.html");
    process.exit(1);
}
processHTML(process.argv[2], process.argv[3]);


function processHTML(infile, outfile) {
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
}
