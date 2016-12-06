#!/bin/bash
APP_NAME="<%= appName %>"
DEPLOY_PREFIX="<%= deployPrefix %>"

cd /tmp
sudo rm -rf /tmp/stud

echo "Cloning stud git repository..."
sudo git clone https://github.com/bumptech/stud.git stud

echo "Compiling..."
(cd stud && sudo make install)
sudo rm -rf /tmp/stud

#make sure comet folder exists
sudo mkdir -p $DEBIAN_FRONTEND/stud

#initial permission
sudo chown -R $USER /etc/init
sudo chown -R $USER $DEBIAN_FRONTEND/stud


if [[ -d /etc/init ]] ; then

echo "Setting up init config"
cat <<END | sudo tee /etc/init/stud.conf
#!upstart
description "starting stud"
author      "comet"

start on runlevel [2345]
stop on runlevel [06]

respawn
limit nofile 65536 65536

script
  stud --config=/opt/stud/stud.conf
end script
END

fi


if [[ -d /etc/systemd/system ]] ; then

echo "Setting up systemd config service"
cat <<END | sudo tee /etc/systemd/system/stud.service
[Unit]
Description=Stud

[Service]
ExecStart=/usr/local/bin/stud --config=<%= deployPrefix %>/stud/stud.conf

[Install]
WantedBy=multi-user.target
END

fi

#create non-privileged user
sudo useradd stud || :
