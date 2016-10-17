#!/bin/bash
UPSTART=0
if [ -x /sbin/initctl ] && /sbin/initctl version 2>/dev/null | /bin/grep -q upstart; then
    UPSTART=1
fi

is_upstart()
{
    if [ -x /sbin/initctl ] && /sbin/initctl version 2>/dev/null | /bin/grep -q upstart; then
        echo 1
    else
        echo 0
    fi
}


# /bin/systemctl
service_enable()
{
    local name=$1
    if [[ $UPSTART == 0 ]] ; then
        echo "sudo systemctl enable ${name}.service"
        sudo systemctl enable ${name}.service
    fi
}

service_disable()
{
    local name=$1
    if [[ $UPSTART == 0 ]] ; then
        echo "sudo systemctl disable ${name}.service"
        sudo systemctl disable ${name}.service
    fi
}

service_reload()
{
    if [[ $UPSTART == 0 ]] ; then
        echo "sudo systemctl daemon-reload"
        sudo systemctl daemon-reload
    fi
}

service_stop()
{
    local name=$1
    if [[ $UPSTART == 1 ]] ; then
        sudo stop $name || :
    else
        sudo systemctl stop ${name}.service
    fi
}

service_start()
{
    local name=$1
    if [[ $UPSTART == 1 ]] ; then
        sudo start $name || :
    else
        sudo systemctl start ${name}.service
    fi
}

service_restart()
{
    local name=$1
    if [[ $UPSTART == 1 ]] ; then
        sudo stop $name || :
        sudo start $name || :
    else
        sudo systemctl restart ${name}.service
    fi
}
