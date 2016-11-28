import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {Task} from "./Task";
import {Session, SessionResult, executeScript, sync} from "../Session";


const fs = require('fs');
const path = require('path');
const util = require('util');

export class StartTask extends Task {

  public describe() : string {
    return `Start ${this.config.app.name}`;
  }

  public run(session : Session) : Promise<SessionResult> {
    return executeScript(session,
      path.resolve(TEMPLATES_DIR, 'service/start'), {
        'vars': this.extendArgs({ })
      });
  }

  public build(taskList) {
    taskList.executeScript(this.describe(), {
      'script': path.resolve(TEMPLATES_DIR, 'service/start'),
      'vars': this.extendArgs({ })
    });
  }
}
