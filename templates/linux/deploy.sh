#!/bin/bash

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
      rm -rf node_modules
      if [ -f binding.gyp ]; then
        sudo npm install
        sudo node-gyp rebuild || :
      else
        sudo npm install
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

revert_app (){
  if [[ -d old_app ]]; then
    sudo rm -rf app
    sudo mv old_app app
    sudo stop <%= appName %> || :
    sudo start <%= appName %> || :

    echo "Latest deployment failed! Reverted back to the previous version." 1>&2
    exit 1
  else
    echo "App did not pick up! Please check app logs." 1>&2
    exit 1
  fi
}


# logic
set -e
set -o xtrace

APP_ROOT=/opt/<%= appName %>
TMP_DIR=/opt/<%= appName %>/tmp
BUNDLE_DIR=${TMP_DIR}/bundle
BUNDLE_TARBALL_FILE=bundle.tar.gz

cd ${TMP_DIR}
echo "Removing bundle..."
sudo rm -rf bundle
echo "Extracing $TMP_DIR/$BUNDLE_TARBALL_FILE"
sudo tar xvzf $BUNDLE_TARBALL_FILE > /dev/null
sudo chmod -R +x *
sudo chown -R ${USER} ${BUNDLE_DIR}

# rebuilding fibers
cd ${BUNDLE_DIR}/programs/server

if [ -d npm ]; then
  (cd npm && rebuild_binary_npm_modules)
fi

if [ -d node_modules ]; then
  (cd node_modules && gyp_rebuild_inside_node_modules)
fi

# Special fix for bcrypt invalid ELF issue
# @see http://stackoverflow.com/questions/27984456/deploying-meteor-app-from-os-x-to-linux-causes-bcrypt-issues
(cd npm/npm-bcrypt && npm install -f bcrypt)
(cd npm && npm install -f bignum)

if [ -f package.json ]; then
  echo "Found package.json, running npm install ..."
  # support for 0.9
  sudo npm install
else
  # support for older versions
  sudo npm install fibers
  sudo npm install bcrypt
fi

cd $APP_ROOT

# remove old app, if it exists
if [ -d old_app ]; then
  sudo rm -rf old_app
fi

## backup current version
if [[ -d app ]]; then
  sudo mv app old_app
fi

sudo mv tmp/bundle app

#wait and check
echo "Waiting for MongoDB to initialize. (5 minutes)"
. $APP_ROOT/config/env.sh
wait-for-mongo ${MONGO_URL} 300000

# restart app
sudo stop <%= appName %> || :
sudo start <%= appName %> || :

echo "Waiting for <%= deployCheckWaitTime %> seconds while app is booting up"
sleep <%= deployCheckWaitTime %>

echo "Checking is app booted or not?"
curl localhost:${PORT} || revert_app

# chown to support dumping heapdump and etc
sudo chown -R meteoruser app
