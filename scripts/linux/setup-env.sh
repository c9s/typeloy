#!/bin/bash
APP_NAME="<%= appName %>"
DEPLOY_PREFIX="<%= deployPrefix %>"
APP_ROOT=$DEPLOY_PREFIX/$APP_NAME

sudo mkdir -p $APP_ROOT
sudo mkdir -p $APP_ROOT/config
sudo mkdir -p $APP_ROOT/tmp
sudo mkdir -p $APP_ROOT/db/archive
sudo mkdir -p $DEPLOY_PREFIX/lib
sudo mkdir -p $DEPLOY_PREFIX/bin

sudo chown ${USER} -R $DEPLOY_PREFIX/lib 
sudo chown ${USER} -R $DEPLOY_PREFIX/bin
sudo chown ${USER} -R $DEPLOY_PREFIX/<%= appName %>

sudo npm install -g forever userdown wait-for-mongo node-gyp

# Creating a non-privileged user with the home directory
sudo useradd -m meteoruser || :
sudo mkdir -p /home/meteoruser/files
sudo mkdir -p /home/meteoruser/logs
sudo chown -R meteoruser: /home/meteoruser
