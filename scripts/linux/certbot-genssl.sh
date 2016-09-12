#!/bin/bash
APP_NAME="<%= appName %>"
EMAIL="<%= email %>"
DOMAIN="<%= domain %>"
DEPLOY_PREFIX="<%= deployPrefix %>"

. /opt/functions.sh

for d in /etc/letsencrypt/live/* ; do
    echo "Generating ssl pem in $d"
    (cd $d && cat privkey.pem cert.pem > ssl.pem)
done

STUD_DIR=$DEPLOY_PREFIX/stud

PEM_SRC=/etc/letsencrypt/live/$DOMAIN/ssl.pem
PEM_DEST=$DEPLOY_PREFIX/stud/ssl.pem

# service_stop stud
if [[ -e $PEM_SRC ]] ; then
    mkdir -p $STUD_DIR
    cp -v $PEM_SRC $PEM_DEST
    service_restart stud
fi
