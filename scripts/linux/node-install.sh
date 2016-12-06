#!/bin/bash
APP_NAME="<%= appName %>"
DEPLOY_PREFIX="<%= deployPrefix %>"

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

cd /tmp
wget -q http://nodejs.org/dist/v${NODE_VERSION}/${NODE_DIST}.tar.gz
tar xvzf ${NODE_DIST}.tar.gz
sudo rm -rf $DEPLOY_PREFIX/nodejs
sudo mv ${NODE_DIST} $DEPLOY_PREFIX/nodejs
