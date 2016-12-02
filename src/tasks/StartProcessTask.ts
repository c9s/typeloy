import {SCRIPT_DIR, TEMPLATES_DIR} from "./Task";
import {DeployTask} from "./DeployTask";
import {Session, SessionResult, executeScript, sync} from "../Session";

export class StartProcessTask extends DeployTask {

  public describe() : string {
    return 'Invoking deployment process';
  }

  public run(session : Session) : Promise<SessionResult> {
    return sync(
      executeScript(session, this.resolveScript(session, 'deploy.sh'), {
        'vars': this.extendArgs({ })
      }),
      executeScript(session, this.resolveScript(session, 'verify.sh'), {
        'vars': this.extendArgs({
          'deployCheckWaitTime': this.config.deploy.checkDelay || 10
        })
      })
    );
  }
}
