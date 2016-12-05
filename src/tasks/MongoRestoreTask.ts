import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {SetupTask} from "./SetupTask";
import {Config} from "../config";
import {Session, SessionResult, executeScript, sync} from "../Session";

const moment = require('moment');

export class MongoRestoreTask extends SetupTask {

  protected remoteFile : string;

  constructor(config : Config, remoteFile : string) {
    super(config);
    this.remoteFile = remoteFile;
  }

  public describe() : string {
    return 'Restoring MongoDB database';
  }

  public run(session : Session) : Promise<SessionResult> {
    const dbName = this.config.mongo.database || this.config.app.name;
    const vars = this.extendArgs({
      host: this.config.mongo.host || "localhost",
      port: this.config.mongo.port || 27017,
      dbName: dbName,
      file: this.remoteFile,
    });
    return executeScript(session, this.resolveScript(session, 'mongo-restore.sh'), {
      "vars": vars
    });
  }
}
