import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {Task} from "./Task";

const fs = require('fs');
const path = require('path');
const util = require('util');

export class StartTask extends Task {

  public describe() : string {
    return `Start ${this.config.app.name}`;
  }

  public build(taskList) {
    taskList.executeScript(this.describe(), {
      'script': path.resolve(TEMPLATES_DIR, 'service/start'),
      'vars': this.extendArgs({ })
    });
  }
}
