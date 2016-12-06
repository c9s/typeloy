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

mkdir -p $APP_ROOT
mkdir -p $TMP_DIR
mkdir -p $APP_DIR

# utilities
gyp_rebuild_inside_node_modules () {
  for npmModule in ./*; do
    cd $npmModule

    isBinaryModule="no"
    # recursively rebuild npm modules inside node_modules
    check_for_binary_modules () {
      if [ -f binding.gyp ]; then
        isBinaryModule="yes"
      fi

      if [ $isBinaryModule != "yes" ]; then
        if [ -d ./node_modules ]; then
          cd ./node_modules
          for module in ./*; do
            (cd $module && check_for_binary_modules)
          done
          cd ../
        fi
      fi
    }

    check_for_binary_modules

    if [ $isBinaryModule = "yes" ]; then
      echo " > $npmModule: npm install due to binary npm modules"
      sudo rm -rf node_modules
      sudo npm install
      # always rebuild because the node version might be different.
      sudo npm rebuild
      if [ -f binding.gyp ]; then
        sudo node-gyp rebuild || :
      fi
    fi
    cd ..
  done
}

rebuild_binary_npm_modules () {
  for package in ./*; do
    if [ -d $package/node_modules ]; then
      (cd $package/node_modules && \
        gyp_rebuild_inside_node_modules)
    elif [ -d $package/main/node_module ]; then
      (cd $package/node_modules && \
        gyp_rebuild_inside_node_modules )
    fi
  done
}

. $DEPLOY_PREFIX/lib/functions.sh
. $APP_ROOT/config/env.sh

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





# logic
set -e

# Dump executed commands
# XXX: Should only be enabled when debug mode is on.
# set -o xtrace

cd ${TMP_DIR}

echo "Extracing $TMP_DIR/$BUNDLE_TARBALL_FILENAME"
sudo tar xvzf $TMP_DIR/$BUNDLE_TARBALL_FILENAME > /dev/null

sudo chown -R ${USER} ${BUNDLE_DIR}

# rebuilding fibers
cd ${BUNDLE_DIR}/programs/server

# the prebuilt binary files might differ, we will need to rebuild everything to
# solve the binary incompatible issues
if [[ $REBUILD_NPM_MODULES == "1" ]] ; then
  if [ -d npm ]; then
    (cd npm && rebuild_binary_npm_modules)
  fi
  if [ -d node_modules ]; then
    (cd node_modules && gyp_rebuild_inside_node_modules)
  fi

  # Special fix for bcrypt invalid ELF issue
  # @see http://stackoverflow.com/questions/27984456/deploying-meteor-app-from-os-x-to-linux-causes-bcrypt-issues
  # @see https://github.com/meteor/meteor/issues/7513

  # for 1.3 
  if [ -d npm/node_modules/meteor/npm-bcrypt/node_modules/bcrypt ] ; then
      sudo rm -rf npm/node_modules/meteor/npm-bcrypt/node_modules/bcrypt
      sudo npm install --update-binary -f bcrypt
      cp -r node_modules/bcrypt npm/node_modules/meteor/npm-bcrypt/node_modules/bcrypt
  fi
  if [ -d npm/node_modules/bignum ] ; then
      (cd npm && sudo npm install --update-binary -f bignum)
  fi
  # for meteor 1.2, we have npm-container
  if [ -d npm/npm-container/node_modules/nsq.js/node_modules/bignum ] ; then
      sudo rm -rf npm/npm-container/node_modules/nsq.js/node_modules/bignum
      sudo npm install --update-binary -f bignum
      cp -r node_modules/bignum npm/npm-container/node_modules/nsq.js/node_modules/bignum
  fi
fi

if [ -f package.json ]; then
  echo "Found package.json, running npm install ..."
  # support for 0.9
  sudo npm install
else
  sudo npm install bignum --update-binary
  sudo npm install fibers --update-binary
fi

cd $APP_ROOT

# remove old app, if it exists
if [ -d $APP_ROOT/old_app ]; then
  sudo rm -rf $APP_ROOT/old_app
fi

## backup current version
if [ -d $APP_ROOT/app ]; then
  sudo mv $APP_ROOT/app $APP_ROOT/old_app
fi
sudo mv $APP_ROOT/tmp/bundle $APP_DIR

# chown to support dumping heapdump and etc
sudo chown -R meteoruser: $APP_DIR

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
