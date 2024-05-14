#!/bin/sh
DATE=`date +"q-%Y-%m-%d.log"`
BASEDIR=/htapps/babel
#BASEDIR=$SDRROOT
BINDIR=${BASEDIR}/ls/scripts
PROGRAM=monitorElapsed.pl
DATADIR=${BASEDIR}/logs/ls

echo $DATE

#echo " ${BINDIR}/$PROGRAM   -b ${DATADIR}/$DATE   "

${BINDIR}/$PROGRAM   -b ${DATADIR}/$DATE   
