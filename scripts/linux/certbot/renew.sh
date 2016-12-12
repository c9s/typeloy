#!/bin/bash
DEPLOY_PREFIX="<%= deployPrefix %>"
APP_NAME="<%= appName %>"
EMAIL="<%= email %>"
DOMAIN="<%= domain %>"
set -e
. $DEPLOY_PREFIX/lib/functions.sh

sudo mkdir -p $DEPLOY_PREFIX/certbot

cd $DEPLOY_PREFIX/certbot

# This will renew all domain name
service_stop $APP_NAME
./certbot-auto renew --standalone \
    --verbose \
    --non-interactive \
    --text \
    --keep-until-expiring
service_start $APP_NAME
