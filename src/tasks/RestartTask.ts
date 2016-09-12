import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {Task} from "./Task";

const fs = require('fs');
const path = require('path');
const util = require('util');

export class RestartTask extends Task {

  public describe() : string {
    const appName = this.config.app.name;
    return `Restart ${appName}`;
  }

  public build(taskList) {
    taskList.executeScript(this.describe(), {
      'script': path.resolve(TEMPLATES_DIR, 'restart.sh'),
      'vars': this.extendArgs({ })
    });
  }
}
