#!/bin/bash
set -e
DEPLOY_PREFIX="<%= deployPrefix %>"
. /opt/functions.sh
stud --test --config=$DEPLOY_PREFIX/stud/stud.conf
service_restart stud
