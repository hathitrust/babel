#! /bin/sh

# © 2005, The Regents of The University of Michigan, All Rights Reserved
#
# Permission is hereby granted, free of charge, to any person obtaining
# a copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject
# to the following conditions:
#
# The above copyright notice and this permission notice shall be
# included in all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
# CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
# TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

# maximum number of days since last use to keep files
DEFAULT_MAXDAYS=7

renice 19 $$ > /dev/null 2>&1

EXIT=0

CACHEDIRSPECS=$*
if [ "X$CACHEDIRSPECS" = "X" ]
  then
  echo "usage: $0 /path/to/purge:min%free[:maxdays] [...]"
  exit 1
fi

for CACHEDIRSPEC in $CACHEDIRSPECS; do
  CACHEDIR=`echo "$CACHEDIRSPEC" | cut -d: -f1`
  MINFREE=`echo "$CACHEDIRSPEC" | cut -d: -f2`
  MAXDAYS=`echo "$CACHEDIRSPEC" | cut -d: -f3`
  if [ "X$MAXDAYS" = "X" ]; then
    MAXDAYS=$DEFAULT_MAXDAYS
  fi
  if [ ! -d $CACHEDIR ]; then
    echo "warning: cache directory '$CACHEDIR' does not exist"

    EXIT=1
  elif [ `echo "$MINFREE" | egrep -c '^[0-9][0-9]*$'` -ne 1 ]; then
    echo "warning: minimum percent free '$MINFREE' must be an integer"

    EXIT=1
  elif [ \( "$MINFREE" -lt 1  \) -o \( "$MINFREE" -gt 99 \) ]; then
    echo "warning: minimum percent free '$MINFREE' must be 0 < n < 100"

    EXIT=1
  elif [ `echo "$MAXDAYS" | egrep -c '^[0-9][0-9]*$'` -ne 1 ]; then
    echo "warning: max acess time days '$MAXDAYS' must be an integer"

    EXIT=1
  else
    DONE=0
    while [ $DONE -eq 0 ]; do
      find $CACHEDIR \
       -follow \
       -type f \
       \( -atime +$MAXDAYS -o -size 0 \) \
       -exec rm -f {} \;

      SPACEUSE=`df    -P $CACHEDIR | tail -1 | awk '{print $5}' | cut -d% -f1`
      INODEUSE=`df -i -P $CACHEDIR | tail -1 | awk '{print $5}' | cut -d% -f1`
      if [ \( $SPACEUSE -gt $MINFREE \) -o \( $INODEUSE -gt $MINFREE \) ]; then
        MAXDAYS=`expr $MAXDAYS - 1`
        if [ $MAXDAYS -eq 0 ]; then
          echo "warning: unable to free enough space or inodes on $CACHEDIR"

 	  DONE=1
        fi
      else
        DONE=1
      fi
    done

    find $CACHEDIR/* \
     -depth \
     -type d \
     -links 2 2> /dev/null | \
    while read CACHESUBDIR; do
      rmdir -p --ignore-fail-on-non-empty "$CACHESUBDIR"
    done
  fi
done

exit $EXIT
