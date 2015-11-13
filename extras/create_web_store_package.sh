#!/bin/bash

cd `dirname $0`
cd ..
rm -f EspruinoSerialTerminal.zip

mkdir img/bak
cp img/icon_*.png img/bak
cp extras/web_store/icon_*.png img
zip -9 -r --exclude=@extras/chrome_exclude.lst EspruinoSerialTerminal.zip .
cp img/bak/icon_*.png img
rm -rf img/bak
