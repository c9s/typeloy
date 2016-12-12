#!/bin/bash
set -e
sudo mkdir -p /opt/certbot
cd /opt/certbot

APP_NAME="<%= appName %>"
EMAIL="<%= email %>"
DOMAIN="<%= domain %>"

. /opt/lib/functions.sh

# This will renew all domain name
service_stop $APP_NAME
./certbot-auto renew --standalone \
    --verbose \
    --non-interactive \
    --text \
    --keep-until-expiring
service_start $APP_NAME
