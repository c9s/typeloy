#!/bin/bash
# vim:sw=2:ts=2:sts=2:
APP_NAME="<%= appName %>"
DEPLOY_PREFIX="<%= deployPrefix %>"
APP_ROOT=$DEPLOY_PREFIX/$APP_NAME
MONGO_HOST=<%= host %>
MONGO_PORT=<%= port %>
DB_NAME="<%= dbName %>"
ARCHIVE_FILE=<%= file %>
mongorestore --gzip --archive=$ARCHIVE_FILE --db $APP_NAME --drop
rm -f $ARCHIVE_FILE
