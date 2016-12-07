import {SetupTask} from "./SetupTask";
import {Task} from "./Task";
import {Config, AppConfig} from "../config";
import {Session, SessionResult, copy, sync} from "../Session";


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

  public run(session : Session) : Promise<SessionResult> {
    const bashenv = this.buildEnvDict();
    return copy(session,
                this.resolveTemplate(session, 'env-vars'),
                this.appRoot + '/config/env-vars',
                { progressBar : true, vars: this.extendArgs({ 'env': bashenv }) });
  }
}


/**
 * Bash EnvVars with export statement
 */
export class BashEnvVarsTask extends EnvVarsTask {

  public describe() : string {
    return 'Setting up environment variable file for bash';
  }

  public run(session : Session) : Promise<SessionResult> {
    const bashenv = this.buildEnvDict();
    return copy(session,
                this.resolveTemplate(session, 'env.sh'),
                this.appRoot + '/config/env.sh',
                { progressBar: true, vars: this.extendArgs({ 'env': bashenv }) });
  }
}
