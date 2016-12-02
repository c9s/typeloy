#!/bin/bash
export DEBIAN_FRONTEND=noninteractive
# Remove the lock
set +e
sudo rm -f /var/lib/dpkg/lock > /dev/null
sudo rm -f /var/cache/apt/archives/lock > /dev/null
sudo dpkg --configure -a
set -e

sudo apt-get -y install libev4 libev-dev gcc make libssl-dev git
cd /tmp
sudo rm -rf /tmp/stud
sudo git clone https://github.com/bumptech/stud.git stud
(cd stud && sudo make install)
sudo rm -rf /tmp/stud

#make sure comet folder exists
sudo mkdir -p /opt/stud

#initial permission
sudo chown -R $USER /etc/init
sudo chown -R $USER /opt/stud

#create non-privileged user
sudo useradd stud || :
