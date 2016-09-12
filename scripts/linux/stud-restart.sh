#!/bin/bash
set -e
APP_NAME="<%= appName %>"
DEPLOY_PREFIX="<%= deployPrefix %>"
. /opt/functions.sh
stud --test --config=$DEPLOY_PREFIX/stud/stud.conf
service_reload
# service_restart stud
