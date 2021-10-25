#!/bin/bash
cd `dirname $0`/..
DIR_IDE=`pwd`
echo $DIR_IDE
cd $DIR_IDE/../Espruino
source ../emsdk/emsdk_env.sh
make clean;RELEASE=1 BOARD=EMSCRIPTEN make || exit 1
make clean;RELEASE=1 BOARD=EMSCRIPTEN2 make || exit 1
cd $DIR_IDE
cp $DIR_IDE/../Espruino/emulator_banglejs*.js js/emu
echo Finished.
