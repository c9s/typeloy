import {SCRIPT_DIR, TEMPLATES_DIR, Task} from "./Task";
import {Session, SessionResult, executeScript, run, sync} from "../Session";

const fs = require('fs');
const path = require('path');
const util = require('util');

export class AptGetUpdateTask extends Task {
  public describe() : string {
    return 'Updating package index';
  }

  public run(session : Session) : Promise<SessionResult> {
    return executeScript(session, path.resolve(SCRIPT_DIR, 'apt-update.sh'));
  }

  public build(taskList) {
    taskList.executeScript(this.describe(), {
      script: path.resolve(SCRIPT_DIR, 'apt-update.sh'), vars: { }
    });
  }
}
