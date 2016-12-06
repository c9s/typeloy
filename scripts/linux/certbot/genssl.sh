#!/bin/bash
APP_NAME="<%= appName %>"
EMAIL="<%= email %>"
DOMAIN="<%= domain %>"
DEPLOY_PREFIX="<%= deployPrefix %>"

. $DEPLOY_PREFIX/lib/functions.sh

set -e

(cd $DEPLOY_PREFIX && openssl dhparam -rand - 1024 | sudo tee dhparam.pem)

if [[ -d /etc/letsencrypt ]] ; then
    sudo find /etc/letsencrypt/ -type d -exec chmod +x {} \;
    sudo chmod -R oga+rw /etc/letsencrypt/
    for d in /etc/letsencrypt/live/* ; do
        echo "Generating ssl pem in $d"
        (cd $d && cat privkey.pem cert.pem $DEPLOY_PREFIX/dhparam.pem | sudo tee ssl.pem)
    done
fi

STUD_DIR=$DEPLOY_PREFIX/stud
PEM_SRC=/etc/letsencrypt/live/$DOMAIN/ssl.pem
PEM_DEST=$DEPLOY_PREFIX/stud/ssl.pem

sudo mkdir -p $STUD_DIR

# service_stop stud
if [[ -e $PEM_SRC ]] ; then
    echo "Found pem file, copying pem file to $PEM_DEST"
    sudo cp -v $PEM_SRC $PEM_DEST
    service_restart stud
fi
