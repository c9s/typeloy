#!/bin/bash
# vim:sw=2:ts=2:sts=2:
DEPLOY_PREFIX="<%= deployPrefix %>"
APP_NAME="<%= appName %>"
APP_ROOT=$DEPLOY_PREFIX/$APP_NAME
TMP_DIR=$APP_ROOT/tmp
APP_DIR=$APP_ROOT/app
BUNDLE_TARBALL_FILENAME=bundle.tar.gz
BUNDLE_EXTRACT_DIR=$TMP_DIR/bundle
BUNDLE_TARBALL_FILENAME=bundle.tar.gz
BUNDLE_TARBALL_PATH=$TMP_DIR/$BUNDLE_TARBALL_FILENAME

. $DEPLOY_PREFIX/lib/functions.sh
. $APP_ROOT/config/env.sh

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

# rebuilding fibers
STAR_JSON=${BUNDLE_EXTRACT_DIR}/star.json

# The prebuilt binary files might differ, we will need to rebuild everything to
# solve the binary incompatible issues
set -e
set -o xtrace

# FOR FIXING THIS ERROR:
#   gyp WARN EACCES user "root" does not have permission to access the dev dir "/root/.node-gyp/4.6.2"
#   gyp WARN EACCES attempting to reinstall using temporary dev dir "/opt/nodejs/lib/node_modules/bcrypt/.node-gyp"
# 
# SEE https://github.com/nodejs/node-gyp/issues/454 FOR MORE DETAILS
sudo chown -v -R nobody: /root/.node-gyp || :

cd ${BUNDLE_EXTRACT_DIR}/programs/server
if [ -f package.json ]; then
  echo "Found package.json, running npm install ..."
  sudo npm install --unsafe-perm
else
  sudo npm install bignum --update-binary --unsafe-perm
  sudo npm install fibers --update-binary --unsafe-perm
fi

if [[ -n $(cat $STAR_JSON | grep "METEOR@1.[32]") ]] ; then
  ([[ -d npm ]] && cd npm && rebuild_binary_npm_modules)
  ([[ -d node_modules ]] && cd node_modules && gyp_rebuild_inside_node_modules)

  # Special fix for bcrypt invalid ELF issue
  # @see http://stackoverflow.com/questions/27984456/deploying-meteor-app-from-os-x-to-linux-causes-bcrypt-issues
  # @see https://github.com/meteor/meteor/issues/7513
  # for 1.3 
  if [ -d npm/node_modules/meteor/npm-bcrypt/node_modules/bcrypt ] ; then
      sudo npm install --unsafe-perm --update-binary -f bcrypt
      sudo cp -r node_modules/bcrypt npm/node_modules/meteor/npm-bcrypt/node_modules/bcrypt
  fi
  if [ -d npm/node_modules/bignum ] ; then
      (cd npm && sudo npm install --unsafe-perm --update-binary -f bignum)
  fi
  # for meteor 1.2, we have npm-container
  if [ -d npm/npm-container/node_modules/nsq.js/node_modules/bignum ] ; then
      sudo rm -rf npm/npm-container/node_modules/nsq.js/node_modules/bignum
      sudo npm install --unsafe-perm --update-binary -f bignum
      sudo cp -r node_modules/bignum npm/npm-container/node_modules/nsq.js/node_modules/bignum
  fi
fi
