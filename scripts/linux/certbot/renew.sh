#!/bin/bash
DEPLOY_PREFIX="<%= deployPrefix %>"
APP_NAME="<%= appName %>"
EMAIL="<%= email %>"
DOMAIN="<%= domain %>"
set -e
. $DEPLOY_PREFIX/lib/functions.sh

sudo mkdir -p $DEPLOY_PREFIX/certbot

cd $DEPLOY_PREFIX/certbot

if [[ -n $(ps aux | grep -v grep | grep stud) ]] ; then
    service_stop stud
fi
service_stop $APP_NAME

# This will renew all domain name
./certbot-auto renew --standalone \
    --verbose \
    --non-interactive \
    --text \
    --keep-until-expiring
