#!/bin/bash
set -e
cat <<END > /etc/yum.repos.d/mongodb-org-3.0.repo
[mongodb-org-3.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2013.03/mongodb-org/3.0/x86_64/
gpgcheck=0
enabled=1
END
sudo yum install -y mongodb-org
sudo service mongod start
sudo chkconfig mongod on
