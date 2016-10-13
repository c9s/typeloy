#!/bin/bash
APP_NAME="<%= appName %>"
APP_ROOT=$DEPLOY_PREFIX/$APP_NAME

sudo mkdir -p $APP_ROOT
sudo mkdir -p $APP_ROOT/config
sudo mkdir -p $APP_ROOT/tmp
sudo mkdir -p /opt/lib
sudo mkdir -p /opt/bin

sudo chown ${USER} -R /opt/<%= appName %>
sudo chown ${USER} -R /opt/lib 
sudo chown ${USER} -R /opt/bin 
sudo chown ${USER} -R /opt/<%= appName %>/tmp 
sudo chown ${USER} -R /opt/<%= appName %>/config 


# Install systemd for app
if [[ -e /lib/systemd/system ]] ; then
echo "Installing systemd ${APP_NAME} service"
cat <<END | sudo tee /lib/systemd/system/${APP_NAME}.service
[Unit]
Description=Meteor Application Service of <%= appName %>
After=network.target

[Service]
Type=simple
WorkingDirectory=<%= appRoot %>
EnvironmentFile=<%= appRoot %>/config/env-vars

# User=meteoruser
# Group=meteoruser

Restart=always
# ExecStartPre=/usr/bin/mkdir -p \${statedir}
ExecStart=/usr/bin/node <%= appRoot %>/app/main.js

[Install]
WantedBy=multi-user.target
END
fi


if [[ -e /etc/init ]] ; then
cat <<END | sudo tee /etc/init/${APP_NAME}.conf
#!upstart
description "Typeloy - <%= appName %>"
author      "Arunoda Susiripala, <arunoda.susiripala@gmail.com>"

start on runlevel [2345]
stop on runlevel [06]

respawn

limit nofile 65536 65536

script
    cd /opt/<%= appName %>

    ## add userdown config
    export USERDOWN_UID=meteoruser USERDOWN_GID=meteoruser

    ## add custom enviromntal variables
    if [ -f config/env.sh ]; then
      . config/env.sh
    fi
    if [ -z \$UPSTART_UID ]; then
      ## start the app using userdown
      forever -c userdown --minUptime 2000 --spinSleepTime 1000 app/main.js
    else
      ## start the app as UPSTART_UID
      exec su -s /bin/sh -c 'exec "\$0" "\$@"' \$UPSTART_UID -- forever --minUptime 2000 --spinSleepTime 1000 app/main.js
    fi
end script
END
fi

sudo npm install -g forever userdown wait-for-mongo node-gyp

# Creating a non-privileged user
sudo useradd meteoruser || :
