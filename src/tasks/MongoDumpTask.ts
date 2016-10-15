import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {SetupTask} from "./SetupTask";

const moment = require('moment');

const fs = require('fs');
const path = require('path');
const util = require('util');

export class MongoDumpTask extends SetupTask {

  public describe() : string {
    return 'Dumping MongoDB database';
  }

  public build(taskList) {
    // console.log(moment("20111031", "YYYYMMDD").fromNow());
    const today = moment().format('YYYYMMDD');
    const dbName = this.config.mongo.database || this.config.app.name;
    let opts = {
        host: this.config.mongo.host || "localhost",
        port: this.config.mongo.port || 27017,
        dbName: dbName,
    } as any;
    if (this.config.mongo.archive && typeof this.config.mongo.archive.file === "string") {
      let file = this.config.mongo.archive.file;
      file = file.replace("%app_name%", this.config.app.name);
      file = file.replace("%db_name%", dbName);
      file = file.replace("%today%", today);
      opts.file = file;
    }
    taskList.executeScript('Dumping MongoDB', {
      "script": path.resolve(SCRIPT_DIR, 'mongo-dump.sh'),
      "vars": this.extendArgs(opts)
    });
  }
}
