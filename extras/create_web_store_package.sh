#!/bin/bash
cd `dirname $0`
cd ..
rm -f EspruinoSerialTerminal.zip
find . -name "*~" -delete

mkdir img/bak
cp img/icon_*.png img/bak
cp extras/web_store/icon_*.png img
zip EspruinoSerialTerminal.zip main.html manifest.json css/*.css css/ui-lightness/*.css css/ui-lightness/images/* img/*.png js/*.js blockly/* blockly/media/*
cp img/bak/icon_*.png img
rm -rf img/bak
