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

set -e
set -o xtrace

. $DEPLOY_PREFIX/lib/functions.sh
. $APP_ROOT/config/env.sh

# remove old app, if it exists
if [ -d $APP_ROOT/old_app ]; then
  sudo rm -rf $APP_ROOT/old_app
fi

## backup current version
if [ -d $APP_ROOT/app ]; then
  sudo mv $APP_ROOT/app $APP_ROOT/old_app
fi

## install
sudo mv $APP_ROOT/tmp/bundle $APP_DIR

# chown to support dumping heapdump and etc
sudo chown -R meteoruser: $APP_DIR
