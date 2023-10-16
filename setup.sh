#!/usr/bin/env bash

cat <<EOT
Checking out into $PWD

What should the git URL be?
 [1] HTTPS: https://github.com/hathitrust (default)
 [2] SSH:   git@github.com:hathitrust
EOT

echo -n "Your choice? [1]: "

read -n 1 proto

GIT_BASE="https://github.com/hathitrust"

if [[ "$proto" == "2" ]]; then
  GIT_BASE="git@github.com:hathitrust"
fi

echo
echo
echo 📥 Cloning repositories via $GIT_BASE...
echo

git clone --recurse-submodules $GIT_BASE/catalog
git clone --recurse-submodules $GIT_BASE/imgsrv-sample-data ./sample-data
git clone --recurse-submodules $GIT_BASE/hathitrust_catalog_indexer
git clone --recurse-submodules $GIT_BASE/lss_solr_configs
git clone --recurse-submodules $GIT_BASE/ptsearch-solr
git clone --recurse-submodules $GIT_BASE/firebird-common

echo
echo 🍃 Setting up the environment...
echo

cat <<EOT | tee .env
CURRENT_USER="$(id -u):$(id -g)"
APACHE_RUN_USER="$(id -u)"
APACHE_RUN_GROUP="$(id -g)"
BABEL_HOME="$(dirname $(realpath $0))"

EOT

echo
echo 🌐 Fetching geoip sample database
echo

curl -o ./geoip/GeoIP2-Country.mmdb 'https://raw.githubusercontent.com/maxmind/MaxMind-DB/main/test-data/GeoIP2-Country-Test.mmdb'

echo
echo 💎 Setting up stage_item...
echo

docker compose run traject bundle install
docker compose run stage-item bundle install

echo
echo 🐦‍🔥 Building firebird...
echo

docker compose run firebird /htapps/babel/firebird-common/bin/build.sh
docker compose run page-turner /htapps/babel/pt/bin/build.sh

echo
echo 🎉 Done!
