import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {SetupTask} from "./SetupTask";

const fs = require('fs');
const path = require('path');
const util = require('util');

export class MongoGetTask extends SetupTask {

  protected filename;

  constructor(config, filename : string) {
    super(config);
    this.filename = filename;
  }

  public describe() : string {
    return 'Get latest mongo archive';
  }

  public build(taskList) {
    taskList.download(`Getting mongo database as ${this.filename}`, {
      "src": this.deployPrefix + '/db/archive/latest',
      "dest": this.filename,
      "progressBar": true
    });
  }
}
