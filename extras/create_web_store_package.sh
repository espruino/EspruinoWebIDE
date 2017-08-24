#!/bin/bash

cd `dirname $0`
TEMPDIR=`pwd`/temp
rm -rf $TEMPDIR
mkdir $TEMPDIR
cd ..
IDEDIR=`pwd`

ZIP=$IDEDIR/EspruinoWebIDE.zip
rm -f $ZIP

# Copy files, excluding some
rsync -av --exclude-from extras/chrome_exclude.lst $IDEDIR/ $TEMPDIR/
# Update icons
cp -v extras/web_store/icon_*.png $TEMPDIR/img
# Merge html
node extras/squish.js --delete-squished $TEMPDIR/main.html $TEMPDIR/main.html


cd $TEMPDIR
zip -9 -r $ZIP .
cd $IDEDIR
rm -rf $TEMPDIR

echo =================================================
echo    App written to $ZIP
echo =================================================
