#!/bin/bash
# Makes a mashed up JS file containing what's needed to
# run the Espruino code building pipeline
#
# You can then just do:
#
# Espruino.transform(js_code, {
#   SET_TIME_ON_WRITE : false,
#   PRETOKENISE : true
# }).then(function(code) {
#   console.log(code);
# });
#

cd `dirname $0`
cd ..

echo Creating espruinotools.js
cat > espruinotools.js << EOF
// EspruinoTools bundle (https://github.com/espruino/EspruinoTools)
// Created with https://github.com/espruino/EspruinoWebIDE/blob/master/extras/create_espruinotools_js.sh
EOF
echo "// Based on EspruinoWebIDE " `sed -ne "s/.*version.*\"\(.*\)\".*/\1/p" package.json` >> espruinotools.js
cat EspruinoTools/espruino.js >> espruinotools.js
cat >> espruinotools.js << EOF
Espruino.Core.Notifications = {
  success : function(e) { console.log(e); },
  error : function(e) { console.error(e); },
  warning : function(e) { console.warn(e); },
  info : function(e) { console.log(e); },
};
Espruino.Core.Status = {
  setStatus : function(e,len) { console.log(e); },
  hasProgress : function() { return false; },
  incrementProgress : function(amt) {}
};
EOF

# hacks to get acorn to work despite node
echo "var acorn = (function(){ var exports={};var module={};" >> espruinotools.js
cat js/libs/acorn/acorn.js >> espruinotools.js
echo "return exports;})();" >> espruinotools.js
cat EspruinoTools/core/utils.js >> espruinotools.js
cat EspruinoTools/core/config.js >> espruinotools.js
# do we need this?
cat EspruinoTools/core/serial.js >> espruinotools.js
cat EspruinoTools/core/codeWriter.js >> espruinotools.js
cat EspruinoTools/core/modules.js >> espruinotools.js
cat EspruinoTools/core/env.js >> espruinotools.js
cat EspruinoTools/core/terminal.js >> espruinotools.js
cat EspruinoTools/plugins/compiler.js >> espruinotools.js
cat EspruinoTools/plugins/assembler.js >> espruinotools.js
cat EspruinoTools/plugins/getGitHub.js >> espruinotools.js
#cat EspruinoTools/libs/utf8.js >> espruinotools.js
#cat EspruinoTools/plugins/unicode.js >> espruinotools.js
echo "if (('undefined' == typeof escodegen) && ('object' == typeof global)) global.escodegen = {};" >> espruinotools.js # hack for esprima in espruinotools.js on node
cat EspruinoTools/libs/esprima/esprima.js >> espruinotools.js
cat EspruinoTools/libs/esprima/esmangle.js >> espruinotools.js
cat EspruinoTools/libs/esprima/escodegen.js >> espruinotools.js
cat EspruinoTools/plugins/minify.js >> espruinotools.js
cat EspruinoTools/plugins/pretokenise.js >> espruinotools.js
cat EspruinoTools/plugins/saveOnSend.js >> espruinotools.js
cat EspruinoTools/plugins/setTime.js >> espruinotools.js
cat >> espruinotools.js << EOF
Espruino.transform = function(code, options) {
  return new Promise(function(resolve,reject) {
    Object.keys(options).forEach(function(key) {
      if (key==key.toUpperCase())
        Espruino.Config[key] = options[key];
    });
    if (options.builtinModules) {
      var d = Espruino.Core.Env.getData();
      d.MODULES = options.builtinModules;
    }
    if (options.boardData)
      Object.assign(Espruino.Core.Env.getBoardData(), options.boardData);

    Espruino.callProcessor("transformForEspruino", code, resolve);
  });
};

if ("undefined"==typeof document) Espruino.init();
if ("undefined"!=typeof module)
  module.exports = Espruino;

EOF
