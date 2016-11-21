import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {SetupTask} from "./SetupTask";
import {Session, SessionResult, executeScript, run, sync} from "../Session";



const fs = require('fs');
const path = require('path');
const util = require('util');

export class NodeJsSetupTask extends SetupTask {

  public describe() : string {
    return 'Installing Node.js: ' + this.getNodeVersion();
  }

  protected getNodeVersion() {
    return this.config.setup.node || '0.10.44';
  }

  public build(taskList) {
    taskList.executeScript(this.describe(), {
      script: path.resolve(SCRIPT_DIR, 'install-node.sh'),
      vars: {
        nodeVersion: this.getNodeVersion(),
        deployPrefix: this.deployPrefix
      }
    });
  }

}
