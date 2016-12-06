#!/bin/bash
APP_NAME="<%= appName %>"
DEPLOY_PREFIX="<%= deployPrefix %>"
set -e
# make sure the epel repo is enabled.
sudo sed -i -e 's/enabled=0/enabled=1/' /etc/yum.repos.d/epel.repo
sudo yum install -y libev libev-devel openssl openssl-devel git gcc make > /dev/null
