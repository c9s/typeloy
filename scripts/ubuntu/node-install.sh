#!/bin/bash
APP_NAME="<%= appName %>"
DEPLOY_PREFIX="<%= deployPrefix %>"
export DEBIAN_FRONTEND=noninteractive

# Remove the lock
set +e
sudo rm -f /var/lib/dpkg/lock > /dev/null
sudo rm -f /var/cache/apt/archives/lock > /dev/null
sudo DEBIAN_FRONTEND=noninteractive dpkg --configure -a
set -e

# Install Node.js - either nodeVersion or which works with latest Meteor release
NODE_VERSION=0.10.47
<% if (nodeVersion) { %>
  NODE_VERSION=<%= nodeVersion %>
<% } %>

ARCH=$(python -c 'import platform; print platform.architecture()[0]')
if [[ ${ARCH} == '64bit' ]]; then
  NODE_ARCH=x64
else
  NODE_ARCH=x86
fi
NODE_DIST=node-v${NODE_VERSION}-linux-${NODE_ARCH}

# Note: lib32stdc++-5-dev libx32stdc++6 are included in g++-multilib
sudo apt-get -y install g++-multilib lib32stdc++6
# python is required to configure node js
sudo apt-get -y install build-essential libssl-dev git curl python

cd /tmp
wget http://nodejs.org/dist/v${NODE_VERSION}/${NODE_DIST}.tar.gz
tar xvzf ${NODE_DIST}.tar.gz
sudo rm -rf $DEPLOY_PREFIX/nodejs
sudo mv ${NODE_DIST} $DEPLOY_PREFIX/nodejs

sudo ln -sf $DEPLOY_PREFIX/nodejs/bin/node /usr/bin/node
sudo ln -sf $DEPLOY_PREFIX/nodejs/bin/npm /usr/bin/npm
sudo npm install -g forever userdown wait-for-mongo node-pre-gyp node-gyp

if [[ -e $DEPLOY_PREFIX/nodejs/lib/node_modules/userdown/bin/userdown ]] ; then
    sudo ln -s $DEPLOY_PREFIX/nodejs/lib/node_modules/userdown/bin/userdown /usr/bin/userdown
fi
if [[ -e $DEPLOY_PREFIX/nodejs/lib/node_modules/forever/bin/forever ]] ; then
    sudo ln -sf $DEPLOY_PREFIX/nodejs/lib/node_modules/forever/bin/forever /usr/bin/forever
fi
if [[ -e $DEPLOY_PREFIX/nodejs/lib/node_modules/wait-for-mongo/bin/wait-for-mongo ]] ; then
    sudo ln -sf $DEPLOY_PREFIX/nodejs/lib/node_modules/wait-for-mongo/bin/wait-for-mongo /usr/bin/wait-for-mongo
fi
