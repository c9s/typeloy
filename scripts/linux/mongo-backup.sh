#!/bin/bash
# vim:sw=2:ts=2:sts=2:
BACKUP_MONGO=<%= backupMongo ? 1 : 0 %>
BACKUP_MONGO_HOST=<%= backupMongo ? backupMongo.host || 'localhost' : 0 %>
BACKUP_MONGO_PORT=<%= backupMongo ? backupMongo.port || 27017 : 0 %>
BACKUP_FILENAME=${APP_NAME}_${TODAY}.gz
echo "Backing up mongodb ..."
mongodump -h $BACKUP_MONGO_HOST -p $BACKUP_MONGO_PORT  --archive=$BACKUP_FILENAME --gzip --db $APP_NAME
