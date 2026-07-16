#!/usr/bin/env bash

BINPATH=$(dirname $(realpath $0))

if ! command -v npm &>/dev/null
then
  echo "npm could not be found in PATH"
  exit
fi

### pageturner build

cd $BINPATH/../pt/web/firebird
lock_check='yes'
src_check='yes'
if [ -f ./dist/manifest.json ]
then
  lock_check=`find package-lock.json -newer ./dist/manifest.json`
  src_check=`find src -newer ./dist/manifest.json`
fi

if [ "$lock_check" == "" ]
then
  echo "pt/firebird: package-lock.json unchanged; skipping install"
else
  npm install
  errVal=$?
  if [ $errVal -ne 0 ]
  then
    exit $errVal
  fi
fi

if [ "$lock_check" == "" -a "$src_check" == "" ]
then
  echo "pt/firebird: app unchanged; skipping build"
else
  npm run build
  errVal=$?
  if [ $errVal -ne 0 ]
  then
    exit $errVal
  fi
fi

echo "pt/firebird build done"

### stamper JAR download

STAMPER_JAR=$BINPATH/../imgsrv-tools/target/stamper.jar
STAMPER_URL=https://github.com/hathitrust/imgsrv-tools/releases/latest/download/stamper.jar

mkdir -p $BINPATH/../imgsrv-tools/target
# Only downloads if the JAR file is missing. To pick up a new release,
# remove imgsrv-tools/target/stamper.jar from the server and re-run stage-app.
if [ ! -f $STAMPER_JAR ]; then
  echo "Downloading stamper JAR..."
  curl -fsSL $STAMPER_URL -o $STAMPER_JAR
  errVal=$?
  if [ $errVal -ne 0 ]; then
    exit $errVal
  fi
fi

echo "stamper JAR ready"
