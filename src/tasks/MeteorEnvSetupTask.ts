import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {SetupTask} from "./SetupTask";
import {Session, SessionResult, executeScript, sync} from "../Session";


const fs = require('fs');
const path = require('path');
const util = require('util');

export class MeteorEnvSetupTask extends SetupTask {
  public describe() : string {
    return 'Setting up environment for meteor application';
  }

  public run(session : Session) : Promise<SessionResult> {
    return executeScript(session, path.resolve(SCRIPT_DIR, 'setup-env.sh'), { vars: this.extendArgs({}) });
  }

  public build(taskList) {
    taskList.executeScript(this.describe(), {
      script: path.resolve(SCRIPT_DIR, 'setup-env.sh'),
      vars: this.extendArgs({})
    });
    taskList.copy("Setting up shared bash functions", {
      src: path.resolve(SCRIPT_DIR, 'functions.sh'),
      dest: this.deployPrefix + '/lib/functions.sh',
      vars: this.extendArgs({ }),
    });
  }
}
