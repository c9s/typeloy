import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {Task} from "./Task";
import {Session, SessionResult, executeScript, sync} from "../Session";


const fs = require('fs');
const path = require('path');
const util = require('util');

export class StopTask extends Task {

  public describe() : string {
    return `Stop ${this.config.app.name}`;
  }

  public run(session : Session) : Promise<SessionResult> {
    return executeScript(session,
      this.resolveScript(session, 'service/stop'), {
        'vars': this.extendArgs({ })
      });
  }

  public build(taskList) {
    taskList.executeScript(this.describe(), {
      'script': path.resolve(TEMPLATES_DIR, 'service/stop'),
      'vars': this.extendArgs({ })
    });
  }
}
