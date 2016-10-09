#!/bin/bash
export DEBIAN_FRONTEND=noninteractive
set -e
DEPLOY_PREFIX="<%= deployPrefix %>"
. /opt/lib/functions.sh
stud --test --config=$DEPLOY_PREFIX/stud/stud.conf
service_restart stud
