#!/bin/bash
# vim:sw=2:ts=2:sts=2:
TODAY=$(date +%Y%m%d)
APP_NAME="<%= appName %>"
DEPLOY_PREFIX="<%= deployPrefix %>"
APP_ROOT=$DEPLOY_PREFIX/$APP_NAME
ARCHIVE_ROOT=$DEPLOY_PREFIX/db/archive
LATEST_ARCHIVE_FILE=$DEPLOY_PREFIX/db/archive/latest
MONGO_HOST=<%= host %>
MONGO_PORT=<%= port %>
DB_NAME="<%= dbName %>"
<% if (file) { %>
    ARCHIVE_FILE=<%= file %>
<% } else { %>
    ARCHIVE_FILE=${APP_NAME}_${TODAY}.gz
<% } %>
set -e
sudo mkdir -p $ARCHIVE_ROOT
sudo chown ${USER} -R $ARCHIVE_ROOT
(cd $ARCHIVE_ROOT \
  && sudo mongodump --host $MONGO_HOST --port $MONGO_PORT  --archive=$ARCHIVE_FILE --gzip --db $DB_NAME \
  && rm -f $LATEST_ARCHIVE_FILE \
  && ln -s $ARCHIVE_FILE $LATEST_ARCHIVE_FILE )
