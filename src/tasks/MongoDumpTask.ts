import {SetupTask} from "./SetupTask";
import {Session, SessionResult, executeScript, sync} from "../Session";


const moment = require('moment');

const fs = require('fs');
const path = require('path');
const util = require('util');

export class MongoDumpTask extends SetupTask {

  public describe() : string {
    return 'Dumping MongoDB database';
  }

  public run(session : Session) : Promise<SessionResult> {
    const today = moment().format('YYYYMMDD');
    const dbName = this.config.mongo.database || this.config.app.name;
    const opts = {
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
    } else {
      opts.file = "%app_name%_%db_name%_%today%.gz";
    }
    return executeScript(session, this.resolveScript(session, 'mongo-dump.sh'), {
      "vars": this.extendArgs(opts)
    });
  }
}
