#!/bin/bash
set -e
cat <<END | sudo tee /etc/yum.repos.d/mongodb-org-3.2.repo
[mongodb-org-3.2]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2013.03/mongodb-org/3.2/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-3.2.asc
END
sudo yum update -y
sudo yum install -y mongodb-org
if [[ ! -e /var/run/mongodb/mongod.pid ]] ; then
    sudo service mongod start
    sudo chkconfig mongod on
fi
