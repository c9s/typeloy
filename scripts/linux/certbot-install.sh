#!/bin/bash
# set -e
mkdir -p /opt/certbot
cd /opt/certbot
curl -O https://dl.eff.org/certbot-auto
chmod a+x certbot-auto

APP_NAME="<%= appName %>"
EMAIL="<%= email %>"
DOMAIN="<%= domain %>"

# Require gpg2 to verify it.
# wget -N https://dl.eff.org/certbot-auto.asc
# gpg2 --recv-key A2CFB51FA275A7286234E7B24D17C995CD9775F2
# gpg2 --trusted-key 4D17C995CD9775F2 --verify certbot-auto.asc certbot-auto
. /opt/functions.sh


if [[ -n $(ps aux | grep -v grep | grep stud) ]] ; then
    service_stop stud
fi
service_stop $APP_NAME
./certbot-auto certonly --standalone \
    --verbose \
    --non-interactive --text \
    --agree-tos \
    --keep-until-expiring \
    --email $EMAIL -d $DOMAIN
service_start $APP_NAME
