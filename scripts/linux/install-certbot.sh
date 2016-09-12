#!/bin/bash
set -e
mkdir -p /opt/certbot
cd /opt/certbot
wget https://dl.eff.org/certbot-auto
chmod a+x certbot-auto

EMAIL="<%= email %>"
DOMAIN="<%= domain %>"

wget -N https://dl.eff.org/certbot-auto.asc
gpg2 --recv-key A2CFB51FA275A7286234E7B24D17C995CD9775F2
gpg2 --trusted-key 4D17C995CD9775F2 --verify certbot-auto.asc certbot-auto

./certbot-auto certonly --standalone --quiet --email $EMAIL -d $DOMAIN

# ./certbot-auto renew --standalone --quiet

for d in /etc/letsencrypt/live/* ; do
    echo "Generating ssl pem in $d"
    (cd $d && cat privkey.pem cert.pem > ssl.pem)
done
