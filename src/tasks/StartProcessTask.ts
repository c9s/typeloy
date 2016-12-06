import {DeployTask} from "./DeployTask";
import {Session, SessionResult, executeScript, sync} from "../Session";

export class StartProcessTask extends DeployTask {

  public describe() : string {
    return 'Invoking deployment process';
  }

  public run(session : Session) : Promise<SessionResult> {
    const opts = {
      'vars': this.extendArgs({
        'deployCheckWaitTime': this.config.deploy.checkDelay || 10
      })
    };

    return sync(
      executeScript(session, this.resolveScript(session, 'app-bundle-extract.sh'), opts),
      executeScript(session, this.resolveScript(session, 'app-bundle-install.sh'), opts),
      executeScript(session, this.resolveScript(session, 'deploy.sh'), opts),
      executeScript(session, this.resolveScript(session, 'verify.sh'), opts)
    );
  }
}
