#!/bin/bash
APP_NAME="<%= appName %>"
DEPLOY_PREFIX="<%= deployPrefix %>"
NODE_MODULES=$DEPLOY_PREFIX/nodejs/lib/node_modules

sudo ln -sf $DEPLOY_PREFIX/nodejs/bin/node /usr/bin/node
sudo ln -sf $DEPLOY_PREFIX/nodejs/bin/npm /usr/bin/npm
sudo npm install -g forever userdown wait-for-mongodb node-pre-gyp node-gyp

# http://ethan.logdown.com/posts/2015/06/23/sh-1-node-gyp-permission-denied
sudo npm config set unsafe-perm true
sudo ln -sf $NODE_MODULES/userdown/bin/userdown /usr/bin/userdown
sudo ln -sf $NODE_MODULES/forever/bin/forever /usr/bin/forever
sudo ln -sf $NODE_MODULES/wait-for-mongodb/bin/wait-for-mongo /usr/bin/wait-for-mongo
