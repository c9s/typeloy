#!/bin/bash
# vim:sw=2:ts=2:sts=2:
APP_NAME="<%= appName %>"
MONGO_HOST="<%= host %>"
MONGO_PORT="<%= port %>"
DB_NAME="<%= dbName %>"
ARCHIVE_FILE="<%= file %>"
set -e
sudo mongorestore --host $MONGO_HOST --port $MONGO_PORT --gzip --archive=$ARCHIVE_FILE --db $APP_NAME --drop
rm -f $ARCHIVE_FILE
