#!/bin/bash
APP_NAME="<%= appName %>"
APP_ROOT=$DEPLOY_PREFIX/$APP_NAME
TMP_DIR=$APP_ROOT/tmp
APP_DIR=$APP_ROOT/app

# check upstart
UPSTART=0
if [ -x /sbin/initctl ] && /sbin/initctl version 2>/dev/null | /bin/grep -q upstart; then
  UPSTART=1
fi

# restart app
echo "Restarting the app"
if [[ $UPSTART == 1 ]] ; then
  sudo stop $APP_NAME || :
  sudo start $APP_NAME || :
else
  sudo systemctl restart ${APP_NAME}.service
fi
