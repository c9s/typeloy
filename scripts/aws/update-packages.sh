#!/bin/bash
set -e
if [[ -e /etc/yum.repos.d/epel.repo ]] ; then
    sudo sed -i -e 's/enabled=0/enabled=1/' /etc/yum.repos.d/epel.repo
fi
sudo yum update -y
sudo yum upgrade -y
