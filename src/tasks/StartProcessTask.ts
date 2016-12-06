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
    return sync([
      (result : SessionResult) => executeScript(session, this.resolveScript(session, 'deploy/extract-bundle.sh'), opts),
      (result : SessionResult) => executeScript(session, this.resolveScript(session, 'deploy/install.sh'), opts),
      (result : SessionResult) => executeScript(session, this.resolveScript(session, 'deploy/move-bundle.sh'), opts),
      (result : SessionResult) => executeScript(session, this.resolveScript(session, 'deploy.sh'), opts),
      (result : SessionResult) => executeScript(session, this.resolveScript(session, 'verify.sh'), opts)
    ]);
  }
}
