import {SCRIPT_DIR, TEMPLATES_DIR, Task} from "./Task";

const fs = require('fs');
const path = require('path');
const util = require('util');

export class AptGetUpdateTask extends Task {
  public describe() : string {
    return 'Updating package index';
  }

  public build(taskList) {
    taskList.executeScript(this.describe(), {
      script: path.resolve(SCRIPT_DIR, 'update.sh'), vars: { }
    });
  }
}
