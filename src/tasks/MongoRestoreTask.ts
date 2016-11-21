import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {SetupTask} from "./SetupTask";
import {Config} from "../config";
import {Session, SessionResult, executeScript, run, sync} from "../Session";


const moment = require('moment');

const fs = require('fs');
const path = require('path');
const util = require('util');

export class MongoRestoreTask extends SetupTask {

  protected remoteFile : string;

  constructor(config : Config, remoteFile : string) {
    super(config);
    this.remoteFile = remoteFile;
  }

  public describe() : string {
    return 'Restoring MongoDB database';
  }

  public build(taskList) {
    const dbName = this.config.mongo.database || this.config.app.name;
    let opts = {
        host: this.config.mongo.host || "localhost",
        port: this.config.mongo.port || 27017,
        dbName: dbName,
        file: this.remoteFile,
    } as any;
    taskList.executeScript(`Restoring mongo database`, {
      "script": path.resolve(SCRIPT_DIR, 'mongo-restore.sh'),
      "vars": this.extendArgs(opts)
    });
  }
}
