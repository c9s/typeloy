import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {Task} from "./Task";

const fs = require('fs');
const path = require('path');
const util = require('util');

export class LogsTask extends Task {

  protected hostPrefix : string;

  protected logOptions : string;

  constructor(config, hostPrefix : string, logOptions : string) {
    super(config);
    this.hostPrefix = hostPrefix;
    this.logOptions = logOptions;
  }

  public describe() : string {
    return `Log ${this.config.app.name}`;
  }

  public build(taskList) {
    taskList.executeScript(this.describe(), {
      "script": path.resolve(TEMPLATES_DIR, 'service/logs'),
      "vars": this.extendArgs({
        "logOptions": this.logOptions
      }),
      "onStdout": () => {
        return (data) => {
          process.stdout.write(this.hostPrefix + data.toString());
        }
      },
      "onStderr": () => {
        return (data) => {
          process.stderr.write(this.hostPrefix + data.toString());
        }
      }
    });
  }
}
