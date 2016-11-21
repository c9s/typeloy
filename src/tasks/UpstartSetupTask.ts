import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {SetupTask} from "./SetupTask";
import {Config, AppConfig} from "../config";
import {Session, SessionResult, executeScript, run, sync} from "../Session";


const fs = require('fs');
const path = require('path');
const util = require('util');

export class UpstartSetupTask extends SetupTask {

  public describe() : string {
    return 'Configuring upstart: ' + this.getUpstartConfigPath();
  }

  protected getUpstartConfigPath() : string {
    return '/etc/init/' + this.config.app.name + '.conf';
  }

  protected getAppName() : string {
    return (<AppConfig>this.config.app).name;
  }

  public build(taskList) {
    var upstartConfig : string = this.getUpstartConfigPath();
    taskList.copy(this.describe(), {
      src: path.resolve(TEMPLATES_DIR, 'meteor/upstart.conf'),
      dest: upstartConfig,
      vars: {
        deployPrefix: this.deployPrefix,
        appName: this.getAppName()
      }
    });
  }
}
