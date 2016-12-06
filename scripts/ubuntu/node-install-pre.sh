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

# Note: lib32stdc++-5-dev libx32stdc++6 are included in g++-multilib
sudo apt-get -y install g++-multilib lib32stdc++6
# python is required to configure node js
sudo apt-get -y install build-essential libssl-dev git curl python
