#!/bin/bash
sudo yum install -y freetype freetype-devel fontconfig
ARCH=`uname -m`
PHANTOMJS_VERSION=1.9.8
cd /usr/local/share/
sudo wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-${PHANTOMJS_VERSION}-linux-${ARCH}.tar.bz2 > /dev/null
sudo tar xjf phantomjs-${PHANTOMJS_VERSION}-linux-${ARCH}.tar.bz2
sudo ln -s -f /usr/local/share/phantomjs-${PHANTOMJS_VERSION}-linux-${ARCH}/bin/phantomjs /usr/local/share/phantomjs
sudo ln -s -f /usr/local/share/phantomjs-${PHANTOMJS_VERSION}-linux-${ARCH}/bin/phantomjs /usr/local/bin/phantomjs
sudo ln -s -f /usr/local/share/phantomjs-${PHANTOMJS_VERSION}-linux-${ARCH}/bin/phantomjs /usr/bin/phantomjs
