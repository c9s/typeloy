import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {Task} from "./Task";
import {Session, SessionResult, executeScript, sync} from "../Session";

const fs = require('fs');
const path = require('path');
const util = require('util');

export class LogsTask extends Task {

  protected hostPrefix : string;

  protected logOptions : any;

  constructor(config, hostPrefix : string, logOptions : any) {
    super(config);
    this.hostPrefix = hostPrefix;
    this.logOptions = logOptions || {};
  }

  public describe() : string {
    return `Log ${this.config.app.name}`;
  }


  protected getStdoutHandler() {
    if (this.logOptions.onStdout) {
      return this.logOptions.onStdout;
    }
    return (hostPrefix : string, data) => {
      process.stdout.write(hostPrefix + data.toString());
    };
  }

  protected getStderrHandler() {
    if (this.logOptions.onStderr) {
      return this.logOptions.onStderr;
    }
    return (hostPrefix : string, data) => {
      process.stderr.write(hostPrefix + data.toString());
    };
  }

  public run(session : Session) : Promise<SessionResult> {
    const onStdout = this.getStdoutHandler();
    const onStderr = this.getStderrHandler();
    return executeScript(session, 
      this.resolveScript(session, 'service/logs'),
      {
        "vars": this.extendArgs({
          "logOptions": this.logOptions.tail ? "-f" : ""
        }),
        "onStdout": (data) => {
          return onStdout(this.hostPrefix, data);
        },
        "onStderr": (data) => {
          return onStderr(this.hostPrefix, data);
        }
      });
  }

  public build(taskList) {
    let onStdout = this.logOptions.onStdout;

    if (!onStdout) {
      onStdout = (hostPrefix : string, data) => {
        process.stdout.write(hostPrefix + data.toString());
      };
    }

    let onStderr = this.logOptions.onStderr;
    if (!onStderr) {
      onStderr = (hostPrefix : string, data) => {
        process.stderr.write(hostPrefix + data.toString());
      };
    }

    taskList.executeScript(this.describe(), {
      "script": path.resolve(TEMPLATES_DIR, 'service/logs'),
      "vars": this.extendArgs({
        "logOptions": this.logOptions.tail ? "-f" : ""
      }),
      "onStdout": () => {
        return (data) => {
          return onStdout(this.hostPrefix, data);
        };
      },
      "onStderr": () => {
        return (data) => {
          return onStderr(this.hostPrefix, data);
        };
      }
    });
  }
}
