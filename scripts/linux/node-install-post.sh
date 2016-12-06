#!/bin/bash
APP_NAME="<%= appName %>"
DEPLOY_PREFIX="<%= deployPrefix %>"

sudo ln -sf $DEPLOY_PREFIX/nodejs/bin/node /usr/bin/node
sudo ln -sf $DEPLOY_PREFIX/nodejs/bin/npm /usr/bin/npm
sudo npm install -g forever userdown wait-for-mongo node-pre-gyp node-gyp

# http://ethan.logdown.com/posts/2015/06/23/sh-1-node-gyp-permission-denied
sudo npm config set unsafe-perm true

if [[ -e $DEPLOY_PREFIX/nodejs/lib/node_modules/userdown/bin/userdown ]] ; then
    sudo ln -s $DEPLOY_PREFIX/nodejs/lib/node_modules/userdown/bin/userdown /usr/bin/userdown
fi
if [[ -e $DEPLOY_PREFIX/nodejs/lib/node_modules/forever/bin/forever ]] ; then
    sudo ln -sf $DEPLOY_PREFIX/nodejs/lib/node_modules/forever/bin/forever /usr/bin/forever
fi
if [[ -e $DEPLOY_PREFIX/nodejs/lib/node_modules/wait-for-mongo/bin/wait-for-mongo ]] ; then
    sudo ln -sf $DEPLOY_PREFIX/nodejs/lib/node_modules/wait-for-mongo/bin/wait-for-mongo /usr/bin/wait-for-mongo
fi
