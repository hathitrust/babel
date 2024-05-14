#!/bin/sh
DATE=`date +"q-%Y-%m-%d.log"`
BASEDIR=/htapps/babel
#BASEDIR=$SDRROOT
BINDIR=${BASEDIR}/ls/scripts
PROGRAM=monitorElapsed.pl
DATADIR=${BASEDIR}/logs/ls

echo $DATE
MINUTES=$1

#echo "${BINDIR}/$PROGRAM -p $MINUTES ${DATADIR}/$DATE   "

${BINDIR}/$PROGRAM -p $MINUTES ${DATADIR}/$DATE   

