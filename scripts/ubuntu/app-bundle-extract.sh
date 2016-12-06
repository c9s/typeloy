#!/bin/bash
# vim:sw=2:ts=2:sts=2:
DEPLOY_PREFIX="<%= deployPrefix %>"
APP_NAME="<%= appName %>"
APP_ROOT=$DEPLOY_PREFIX/$APP_NAME
TMP_DIR=$APP_ROOT/tmp
APP_DIR=$APP_ROOT/app
BUNDLE_DIR=$TMP_DIR/bundle
BUNDLE_TARBALL_FILENAME=bundle.tar.gz

. $DEPLOY_PREFIX/lib/functions.sh
. $APP_ROOT/config/env.sh

# Dump executed commands
# TODO: should be enabled only when debug mode is on.
# set -e
# set -o xtrace

cd ${TMP_DIR}
echo "Extracing $TMP_DIR/$BUNDLE_TARBALL_FILENAME"
sudo tar xzf $TMP_DIR/$BUNDLE_TARBALL_FILENAME
sudo chown -R ${USER} ${BUNDLE_DIR}
