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
MAXDAYS=7
CHOKE_DIR=/ram/choke

# minimum amount of space that must be free (KB)
#MINFREE=2000000

renice 19 $$ > /dev/null 2>&1

EXIT=0

for CACHEDIR in `dirname $0`/../../cache $CHOKE_DIR; do
  if [ ! -d $CACHEDIR ]; then
    echo "warning: cache directory $CACHEDIR does not exist"

    EXIT=1
  else
    DONE=0
    while [ $DONE -eq 0 ]; do
      find $CACHEDIR \
       -follow \
       -type f \
       \( -atime +$MAXDAYS -o -size 0 \) \
       -exec rm -f {} \;

       DONE=1
#      FREE=`df -k $CACHEDIR | tail -1 | awk '{print $4}'`

#      if [ $FREE -lt $MINFREE ]; then
#        MAXDAYS=`echo $MAXDAYS - 1 | bc`
#        if [ $MAXDAYS = 0 ]; then
#	  DONE=1
#        fi
#      else
#        DONE=1
#      fi
    done

    case `/bin/uname` in
      AIX|SunOS)
         RMDIR="/bin/rmdir -ps"
         ;;
      *)
         RMDIR="rmdir -p --ignore-fail-on-non-empty"
         ;;
    esac
    find $CACHEDIR/* \
     -depth \
     -type d \
     -links 2 2> /dev/null | \
    while read CACHESUBDIR; do
      $RMDIR "$CACHESUBDIR"
    done
  fi
done

exit $EXIT
