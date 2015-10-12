#!/bin/bash

cd `dirname $0`

##https://github.com/voodootikigod/node-serialport/issues/374
#NW_VERSION=0.12.3
#npm install serialport
#sudo npm install node-pre-gyp -g
#cd node_modules/serialport
#node-pre-gyp rebuild --runtime=node-webkit --target=$NW_VERSION
#cd ../..

rm -f espruino.nw
cd nodewebkit

zip ../espruino.nw *
cd ../..
find . -name *~ -delete
zip -9 -r --exclude=@extras/chrome_exclude.lst extras/espruino.nw .
zip -9 -r extras/espruino.nw node_modules/serialport

echo ------------------------------------
echo nw extras/espruino.nw
