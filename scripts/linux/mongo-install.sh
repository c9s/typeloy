#!/bin/bash
export DEBIAN_FRONTEND=noninteractive

# Remove the lock
set +e
sudo rm -f /var/lib/dpkg/lock > /dev/null
sudo rm -f /var/cache/apt/archives/lock > /dev/null
sudo DEBIAN_FRONTEND=noninteractive dpkg --configure -a
set -e

source /opt/lib/functions.sh

# to read Ubuntu distrib ID vars
# DISTRIB_ID=Ubuntu
# DISTRIB_RELEASE=16.04
# DISTRIB_CODENAME=xenial
# DISTRIB_DESCRIPTION="Ubuntu 16.04.1 LTS"
[[ -e /etc/lsb-release ]] && source /etc/lsb-release

if [[ -n "$DISTRIB_CODENAME" ]] ; then
    sudo DEBIAN_FRONTEND=noninteractive apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
    echo "deb http://repo.mongodb.org/apt/ubuntu $DISTRIB_CODENAME/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
else
    # For backward compatiblity
    sudo DEBIAN_FRONTEND=noninteractive apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
    echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
fi

# run update the get the new source list
sudo apt-get update -y
sudo apt-get install -y mongodb-org mongodb-org-server mongodb-org-shell mongodb-org-tools

# setup mongodb log directory
sudo mkdir -p /var/log/mongodb
sudo chown -R mongodb: /var/log/mongodb

cat <<END | sudo tee /etc/mongod.conf
bind_ip = 127.0.0.1
dbpath=/var/lib/mongodb/
logpath=/var/log/mongodb/mongodb.log
logappend=true
END

if [[ -e /lib/systemd ]] ; then
cat <<END | sudo tee /lib/systemd/system/mongo.service
[Unit]
Description=High-performance, schema-free document-oriented database
After=network.target
Documentation=https://docs.mongodb.org/manual

[Service]
User=mongodb
Group=mongodb
ExecStart=/usr/bin/mongod --quiet --config /etc/mongod.conf
Restart=always

[Install]
WantedBy=multi-user.target
END
    sudo systemctl daemon-reload
    sudo systemctl enable mongo
fi


# Restart mongodb for upstart
service_reload
service_stop mongo || :
service_start mongo
