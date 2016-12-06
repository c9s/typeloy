import {SetupTask} from "./SetupTask";
import {Config, AppConfig} from "../config";
import {Session, SessionResult, executeScript, copy} from "../Session";

import path from 'path';

const util = require('util');

export class SystemdSetupTask extends SetupTask {

  public describe() : string {
    return 'Configuring systemd: ' + this.getConfigPath();
  }

  protected getConfigPath() : string {
    return `/lib/systemd/system/${this.getAppName()}.service`;
  }

  public run(session : Session) : Promise<SessionResult> {
    return copy(session,
      this.resolveTemplate(session, 'meteor/systemd.conf'),
      this.getConfigPath(), {
        'vars': this.extendArgs({ })
      });
  }
}
