#!/usr/bin/env bash

babel_home=$(dirname $(realpath $0))
auth_path=$babel_home/apache/auth

userdesc() {
  desc=$(head -1 $1)
  echo ${desc#\# }
}

ord() {
  LC_CTYPE=C printf %d "'$1"
}

chr () {
  local val
  printf -v val %o "$1"; printf "\\$val"
}

color_white="\x1B[1;37m"
color_cyan="\x1B[1;36m"
color_reset="\x1B[0m"

echo -e "🔁 ${color_white}Switching users...${color_reset}"
echo -e "👤 ${color_cyan}Current user:${color_reset} $(userdesc $auth_path/active_auth.conf)"
echo

echo -e "${color_cyan}User types${color_reset}"
files=($(/bin/ls $auth_path/*conf | grep -v active_auth.conf))
for index in ${!files[@]}; do
  file=${files[$index]}
  letterindex=$(chr $(( index + 97 )))
  echo -e "${color_white}$letterindex${color_reset}) $(userdesc $file) (${color_cyan}$(basename $file)${color_reset})";
done

echo
echo -ne "${color_white}Choose a user type (or ctrl-C to cancel):${color_reset} "

read -n 1 choice

choice_index=$(( $(ord $choice) - 97 ))

auth_file=${files[$choice_index]}

echo
echo

echo -e "${color_cyan}Using auth file \x1B[37m$auth_file${color_reset}"
cp -v $auth_file $auth_path/active_auth.conf
echo -e "${color_cyan}Setting local development mode${color_reset}"
docker compose up -d apache
docker compose exec apache bash -c "perl mdp-lib/bin/debug.pl --enable > /dev/null"
echo -e "${color_cyan}Configuring mocked holdings API${color_reset}"
for app in pt imgsrv ssd; do
  echo "holdings_api_url = http://apache:8080/mock-holdings-api" >> $babel_home/$app/lib/Config/local.conf
done
echo -e "${color_cyan}Resetting ht_sessions database table ${color_reset}"
docker compose exec mysql-sdr mariadb -vv -u mdp-lib -pmdp-lib -h localhost ht -e "DELETE FROM ht_sessions;"
echo -e "${color_cyan}Reloading Apache configuration${color_reset}"
docker compose exec apache kill -USR1 1

echo -e "🎉 ${color_cyan} Done!${color_reset}"

