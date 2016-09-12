import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {SetupTask} from "./SetupTask";
import {Task} from "./Task";
import {Config, AppConfig} from "../config";

const fs = require('fs');
const path = require('path');
const util = require('util');

/**
 * EnvVars with export statement
 */
export class EnvVarsTask extends Task {

  protected env;

  constructor(config : Config, env) {
    super(config);
    this.env = env;
  }

  public describe() : string {
    return 'Setting up environment variable file';
  }

  protected buildEnvDict() {
    let bashenv = {};
    for (let key in this.env) {
      let val = this.env[key];
      if (typeof val === "object") {
        // Do proper escape
        bashenv[key] = JSON.stringify(val).replace(/[\""]/g, '\\"')
      } else if (typeof val === "string") {
        bashenv[key] = val.replace(/[\""]/g, '\\"');
      } else {
        bashenv[key] = val;
      }
    }
    return bashenv;
  }

  public build(taskList) {
    const bashenv = this.buildEnvDict();
    taskList.copy(this.describe(), {
      'src': path.resolve(TEMPLATES_DIR, 'env-vars'),
      'dest': this.appRoot + '/config/env-vars',
      'vars': this.extendArgs({ 'env': bashenv }),
    });
  }
}


/**
 * Bash EnvVars with export statement
 */
export class BashEnvVarsTask extends EnvVarsTask {

  public describe() : string {
    return 'Setting up environment variable file for bash';
  }

  public build(taskList) {
    let bashenv = this.buildEnvDict();
    taskList.copy(this.describe(), {
      'src': path.resolve(TEMPLATES_DIR, 'env.sh'),
      'dest': this.appRoot + '/config/env.sh',
      'vars': this.extendArgs({ 'env': bashenv }),
    });
  }
}
