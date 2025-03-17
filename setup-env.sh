#!/usr/bin/env bash

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
