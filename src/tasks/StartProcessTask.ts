import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {DeployTask} from "./DeployTask";
import {Session, SessionResult, executeScript, run, sync} from "../Session";


const fs = require('fs');
const path = require('path');
const util = require('util');

export class StartProcessTask extends DeployTask {

  public describe() : string {
    return 'Invoking deployment process';
  }

  public build(taskList) {
    taskList.executeScript(this.describe(), {
      'script': path.resolve(TEMPLATES_DIR, 'deploy.sh'),
      'vars': this.extendArgs({ })
    });

    taskList.executeScript("Verifying deployment", {
      'script': path.resolve(TEMPLATES_DIR, 'verify.sh'),
      'vars': this.extendArgs({
        'deployCheckWaitTime': this.config.deploy.checkDelay || 10
      })
    });
  }
}
