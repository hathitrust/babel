#!/bin/bash

babel_home=$(realpath $(dirname "$0")/..)
auth_path=$babel_home/apache/auth

echo "babel home is $babel_home"
echo "auth path is $auth_path"

# non-interactive version of the parts of switch_auth.sh that we need
switch_auth() {
  auth_file="$1.conf"
  echo -e "Using auth file $auth_file"
  cp -v "$auth_path/$auth_file" "$auth_path/active_auth.conf"

  echo -e "Resetting ht_sessions database table "
  docker compose exec mysql-sdr mariadb -u mdp-lib -pmdp-lib -h localhost ht -e "DELETE FROM ht_sessions;"
  echo -e "Reloading Apache configuration"
  docker compose exec apache-test kill -USR1 1
}


# Run regular tests with non-logged-in user
switch_auth 000_none
docker compose run --rm playwright

# Run tests for each kind of authenticated user where we have tests
for usertype in ssd_user resource_sharing_user; do
  switch_auth $usertype
  docker compose run --rm playwright npx playwright test $usertype --trace on
done
