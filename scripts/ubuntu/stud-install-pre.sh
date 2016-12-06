#!/bin/bash
APP_NAME="<%= appName %>"
DEPLOY_PREFIX="<%= deployPrefix %>"

export DEBIAN_FRONTEND=noninteractive
# Remove the lock
set +e
sudo rm -f /var/lib/dpkg/lock > /dev/null
sudo rm -f /var/cache/apt/archives/lock > /dev/null
sudo dpkg --configure -a
set -e

sudo apt-get -y install libev4 libev-dev gcc make libssl-dev git
