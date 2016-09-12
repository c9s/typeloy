#!/bin/bash
set -e
mkdir -p /opt/certbot
cd /opt/certbot

# This will renew all domain name
./certbot-auto renew --standalone --quiet
