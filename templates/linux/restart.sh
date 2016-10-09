#!/bin/bash
APP_NAME="<%= appName %>"
APP_ROOT=$DEPLOY_PREFIX/$APP_NAME

. /opt/lib/functions.sh

# restart app
echo "Restarting the app"
service_restart $APP_NAME
