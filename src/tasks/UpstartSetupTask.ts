import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {SetupTask} from "./SetupTask";
import {Config, AppConfig} from "../config";
import {Session, SessionResult, executeScript, copy, sync} from "../Session";

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

  public run(session : Session) : Promise<SessionResult> {
    const upstartConfig = this.getUpstartConfigPath();
    return copy(session,
                this.resolveTemplate(session, 'meteor/upstart.conf'),
                upstartConfig,
                { vars: this.extendArgs({ }) }
            );
  }
}
