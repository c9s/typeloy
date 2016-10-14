#!/bin/bash
# vim:sw=2:ts=2:sts=2:
DEPLOY_PREFIX="<%= deployPrefix %>"
APP_NAME="<%= appName %>"
APP_ROOT=$DEPLOY_PREFIX/$APP_NAME
TMP_DIR=$APP_ROOT/tmp
APP_DIR=$APP_ROOT/app
DEPLOY_CHECK_WAIT_TIME=<%= deployCheckWaitTime %>

. $DEPLOY_PREFIX/lib/functions.sh

revert_app () {
  if [[ -d $APP_ROOT/old_app ]]; then
    sudo rm -rf $APP_ROOT/app
    sudo mv $APP_ROOT/old_app $APP_ROOT/app
    service_restart $APP_NAME || :
    echo "Latest deployment failed! Reverted back to the previous version." 1>&2
    exit 1
  else
    echo "App did not pick up! Please check app logs." 1>&2
    exit 1
  fi
}

echo "Waiting for $DEPLOY_CHECK_WAIT_TIME seconds while app is booting up"
sleep $DEPLOY_CHECK_WAIT_TIME

echo "Checking app on localhost:${PORT}"
curl --connect-timeout 30 localhost:${PORT} || revert_app
