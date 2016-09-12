#!/bin/bash
for d in /etc/letsencrypt/live/* ; do
    echo "Generating ssl pem in $d"
    (cd $d && cat privkey.pem cert.pem > ssl.pem)
done
