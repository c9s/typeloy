#!/bin/bash
# Remove the lock

# Install Node.js - either nodeVersion or which works with latest Meteor release
<% if (nodeVersion) { %>
  NODE_VERSION=<%= nodeVersion %>
<% } else {%>
  NODE_VERSION=0.10.47
<% } %>

ARCH=$(python -c 'import platform; print platform.architecture()[0]')
if [[ ${ARCH} == '64bit' ]]; then
  NODE_ARCH=x64
  YUM_ARCH=x86_64
else
  NODE_ARCH=x86
  YUM_ARCH=i686
fi
NODE_DIST=node-v${NODE_VERSION}-linux-${NODE_ARCH}

# Note: lib32stdc++-5-dev libx32stdc++6 are included in g++-multilib
sudo yum install -y gcc48-c++ libgcc48 libstdc++48

# python is required to configure node js
sudo yum install -y git curl python

cd /tmp
wget http://nodejs.org/dist/v${NODE_VERSION}/${NODE_DIST}.tar.gz
tar xvzf ${NODE_DIST}.tar.gz
sudo rm -rf /opt/nodejs
sudo mv ${NODE_DIST} /opt/nodejs

sudo ln -sf /opt/nodejs/bin/node /usr/bin/node
sudo ln -sf /opt/nodejs/bin/npm /usr/bin/npm
sudo npm install -g forever 
sudo npm install -g wait-for-mongo
sudo npm install -g node-pre-gyp
sudo npm install -g node-gyp

if [[ -e /opt/nodejs/lib/node_modules/forever/bin/forever ]] ; then
    sudo ln -sf /opt/nodejs/lib/node_modules/forever/bin/forever /usr/bin/forever
fi
if [[ -e /opt/nodejs/lib/node_modules/wait-for-mongo/bin/wait-for-mongo ]] ; then
    sudo ln -sf /opt/nodejs/lib/node_modules/wait-for-mongo/bin/wait-for-mongo /usr/bin/wait-for-mongo
fi
