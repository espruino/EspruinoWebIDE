#!/bin/bash
cd `dirname $0`/..
DIR_IDE=`pwd`
echo $DIR_IDE
cd $DIR_IDE/../Espruino
source ../emsdk/emsdk_env.sh
make clean;RELEASE=1 BOARD=EMSCRIPTEN make
cd $DIR_IDE
cp $DIR_IDE/../Espruino/emulator_espruino.js js/plugins/emulator_espruino.js
echo Finished.
