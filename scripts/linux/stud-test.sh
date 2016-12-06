#!/bin/bash
export DEPLOY_PREFIX="<%= deployPrefix %>"
set -e
stud --test --config=$DEPLOY_PREFIX/stud/stud.conf
