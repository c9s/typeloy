#!/bin/bash
# Remove the lock
set -e
APP_NAME="<%= appName %>"
DEPLOY_PREFIX="<%= deployPrefix %>"
sudo yum install -y gcc-c++ gcc48 gcc48-c++ gcc48-c++ libgcc48 libstdc++48 libstdc++48-devel libstdc++-devel > /dev/null
sudo yum install -y git curl python > /dev/null
