#!/bin/bash
set -e
mkdir -p /opt/certbot
cd /opt/certbot

EMAIL="<%= email %>"
DOMAIN="<%= domain %>"

# This will renew all domain name
./certbot-auto renew --standalone --quiet

for d in /etc/letsencrypt/live/* ; do
    echo "Generating ssl pem in $d"
    (cd $d && cat privkey.pem cert.pem > ssl.pem)
done
