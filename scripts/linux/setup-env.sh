#!/bin/bash
APP_NAME="<%= appName %>"
DEPLOY_PREFIX="<%= deployPrefix %>"
APP_ROOT=$DEPLOY_PREFIX/$APP_NAME

sudo mkdir -p $APP_ROOT
sudo mkdir -p $APP_ROOT/config
sudo mkdir -p $APP_ROOT/tmp
sudo mkdir -p /opt/lib
sudo mkdir -p /opt/bin

sudo chown ${USER} -R /opt/lib 
sudo chown ${USER} -R /opt/bin 
sudo chown ${USER} -R /opt/<%= appName %>

sudo npm install -g forever userdown wait-for-mongo node-gyp

# Creating a non-privileged user
sudo useradd meteoruser || :
