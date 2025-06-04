#!/bin/bash

testset=${1:-all}

babel_home=$(realpath $(dirname "$0")/..)
auth_path=$babel_home/apache/auth

# non-interactive version of the parts of switch_auth.sh that we need
switch_auth() {
  auth_file="$1.conf"
  echo -e "Using auth file $auth_file"
  cp -v "$auth_path/$auth_file" "$auth_path/active_auth.conf"

  echo -e "${color_cyan}Configuring mocked holdings API${color_reset}"
  echo "holdings_api_url = http://apache-test:8080/mock-holdings-api" >> $babel_home/imgsrv/lib/Config/local.conf
  echo "holdings_api_url = http://apache-test:8080/mock-holdings-api" >> $babel_home/pt/lib/Config/local.conf

  echo -e "Resetting ht_sessions database table "
  docker compose exec mysql-sdr mariadb -u mdp-lib -pmdp-lib -h localhost ht -e "DELETE FROM ht_sessions;"
  echo -e "Reloading Apache configuration"
  docker compose exec apache-test kill -USR1 1
}

run_or_exit() {
  command="$@"

  if $command; then
    echo "Run successful";
  else
    cmd_retval=$?
    echo "Run failed";
    exit $cmd_retval;
  fi
}

run_test() {
  usertype=$1
  if [ "$usertype" == "unauthed" ]; then
    # Run regular tests with non-logged-in user
    switch_auth 000_none
    run_or_exit docker compose run --rm playwright
  else
    # Run tests for the given kind of authenticated user
    switch_auth $usertype
    run_or_exit docker compose run --rm playwright npx playwright test $usertype --trace on
  fi

}

if [ "$testset" == "all" ]; then
  run_test unauthed
  run_test ssd_user
  run_test resource_sharing_user
else
  run_test $testset
fi
