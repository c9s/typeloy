#!/bin/bash
export DEBIAN_FRONTEND=noninteractive

# Remove the lock
set +e
sudo rm -f /var/lib/dpkg/lock > /dev/null
sudo rm -f /var/cache/apt/archives/lock > /dev/null  
sudo DEBIAN_FRONTEND=noninteractive dpkg --configure -a
set -e

# install requirement
sudo apt-get -y install libfreetype6 libfreetype6-dev fontconfig
