#!/bin/bash

BABEL_HOME=$(dirname $(realpath $0))
cd $(dirname $(realpath $0))

echo "Stopping mysql.."
docker compose stop mysql-sdr
docker compose rm -f mysql-sdr
echo "Removing database.."
docker volume rm babel_mysql_sdr_data
echo "Restarting.."
docker compose up -d mysql-sdr
