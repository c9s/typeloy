#!/bin/bash
export DEBIAN_FRONTEND=noninteractive
export DEPLOY_PREFIX="<%= deployPrefix %>"
set -e
. /opt/lib/functions.sh
stud --test --config=$DEPLOY_PREFIX/stud/stud.conf
service_restart stud
