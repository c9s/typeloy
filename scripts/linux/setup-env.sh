#!/bin/bash
sudo mkdir -p /opt/<%= appName %>/
sudo mkdir -p /opt/<%= appName %>/config
sudo mkdir -p /opt/lib
sudo mkdir -p /opt/bin
sudo mkdir -p /opt/<%= appName %>/tmp

sudo chown ${USER} -R /opt/<%= appName %> /opt/lib 
sudo chown ${USER} /etc/init
sudo chown ${USER} /etc/

sudo npm install -g forever userdown wait-for-mongo node-gyp

# Creating a non-privileged user
sudo useradd meteoruser || :
