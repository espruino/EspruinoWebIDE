#!/bin/bash

cd `dirname $0`
cd ..

ZIP=EspruinoWebIDE.zip
rm -f $ZIP

mkdir img/bak
cp img/icon_*.png img/bak
cp extras/web_store/icon_*.png img
zip -9 -r --exclude=@extras/chrome_exclude.lst $ZIP .
cp img/bak/icon_*.png img
rm -rf img/bak

echo =================================================
echo    App written to $ZIP
echo =================================================
