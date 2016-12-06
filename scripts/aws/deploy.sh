#!/bin/bash
# vim:sw=2:ts=2:sts=2:
TODAY=$(date +%Y%m%d)
DEPLOY_PREFIX="<%= deployPrefix %>"
APP_NAME="<%= appName %>"
APP_ROOT=$DEPLOY_PREFIX/$APP_NAME
TMP_DIR=$APP_ROOT/tmp
APP_DIR=$APP_ROOT/app
BUNDLE_DIR=$TMP_DIR/bundle
BUNDLE_TARBALL_FILENAME=bundle.tar.gz
# This is for fixing the arch binary issue
REBUILD_NPM_MODULES=1

. $DEPLOY_PREFIX/lib/functions.sh
. $APP_ROOT/config/env.sh

set -e
set -o xtrace

# Install systemd for app
if [ -d /lib/systemd/system ] ; then
echo "Installing systemd ${APP_NAME} service"
cat <<END | sudo tee /lib/systemd/system/${APP_NAME}.service
[Unit]
Description=Meteor Application Service of <%= appName %>
After=network.target

[Service]
Type=simple
WorkingDirectory=<%= appRoot %>
EnvironmentFile=<%= appRoot %>/config/env-vars

# Running meteoruser might need root permission at port 80
# User=meteoruser
# Group=meteoruser

Restart=always
# ExecStartPre=/usr/bin/mkdir -p \${statedir}
ExecStart=/usr/bin/node <%= appRoot %>/app/main.js

[Install]
WantedBy=multi-user.target
END
fi


if [ -d /etc/init ] ; then
cat <<END | sudo tee /etc/init/${APP_NAME}.conf
#!upstart
description "Typeloy - <%= appName %>"
author      "Arunoda Susiripala, <arunoda.susiripala@gmail.com>"

start on runlevel [2345]
stop on runlevel [06]

respawn

limit nofile 65536 65536

script
    cd /opt/<%= appName %>

    ## add userdown config
    export USERDOWN_UID=meteoruser USERDOWN_GID=meteoruser

    ## add custom enviromntal variables
    if [ -f config/env.sh ]; then
      . config/env.sh
    fi
    if [ -z \$UPSTART_UID ]; then
      ## start the app using userdown
      forever -c userdown --minUptime 2000 --spinSleepTime 1000 app/main.js
    else
      ## start the app as UPSTART_UID
      exec su -s /bin/sh -c 'exec "\$0" "\$@"' \$UPSTART_UID -- forever --minUptime 2000 --spinSleepTime 1000 app/main.js
    fi
end script
END
fi

cd $APP_ROOT

# wait and check
echo "Waiting for MongoDB to initialize. (5 minutes)"
wait-for-mongo $MONGO_URL 300000

# reload the service entry
service_reload
service_enable $APP_NAME

# check upstart
UPSTART=0
if [ -x /sbin/initctl ] && /sbin/initctl version 2>/dev/null | /bin/grep -q upstart; then
  UPSTART=1
fi

# restart app
echo "Restarting the app"
service_restart $APP_NAME
