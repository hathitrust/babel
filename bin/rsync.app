#!/bin/bash

DEST_PREFIX=$1
shift

DEPLOY_DEST=${DEST_PREFIX}babel
DEPLOY_SRC=/htapps/test.babel

INCLUDE=$(cat <<EOT
  $DEPLOY_SRC/htd
  $DEPLOY_SRC/htdc
  $DEPLOY_SRC/imgsrv
  $DEPLOY_SRC/imgsrv-tools
  $DEPLOY_SRC/kgs
  $DEPLOY_SRC/logout
  $DEPLOY_SRC/ls
  $DEPLOY_SRC/mb
  $DEPLOY_SRC/mdp-lib
  $DEPLOY_SRC/mdp-misc
  $DEPLOY_SRC/mdp-web
  $DEPLOY_SRC/ping
  $DEPLOY_SRC/plack-lib
  $DEPLOY_SRC/pt
  $DEPLOY_SRC/slip
  $DEPLOY_SRC/slip-lib
  $DEPLOY_SRC/ssd
  $DEPLOY_SRC/watermarks
  $DEPLOY_SRC/wayf
  $DEPLOY_SRC/whoami
EOT
)

EXCLUDE=$(cat <<EOT
  --exclude .github
  --exclude .git
  --exclude docker-compose.yml
  --exclude Dockerfile
  --exclude rsync.timestamp
  --exclude node_modules
  --exclude STOPSLIP
  --exclude imgsrv/scripts
  --exclude imgsrv-tools/src
EOT
)

echo /usr/bin/rsync "$@" $EXCLUDE $INCLUDE $DEPLOY_DEST
