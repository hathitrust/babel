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
