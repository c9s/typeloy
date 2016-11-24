import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {SetupTask} from "./SetupTask";
import {Session, SessionResult, executeScript} from "../Session";

const fs = require('fs');
const path = require('path');
const util = require('util');

export class MongoSetupTask extends SetupTask {

  public describe() : string {
    return 'Copying MongoDB configuration';
  }

  public run(session : Session) : Promise<SessionResult> {
    return executeScript(session, path.resolve(SCRIPT_DIR, 'mongo-install.sh'));
  }

  public build(taskList) {
    taskList.executeScript('Installing MongoDB', {
      script: path.resolve(SCRIPT_DIR, 'mongo-install.sh')
    });
  }
}
