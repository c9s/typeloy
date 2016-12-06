import {SetupTask} from "./SetupTask";
import {Session, SessionResult, executeScript, sync} from "../Session";

export class NodeJsSetupTask extends SetupTask {

  public describe() : string {
    return 'Installing Node.js: ' + this.getNodeVersion();
  }

  public run(session : Session) : Promise<SessionResult> {
    const vars = this.extendArgs({
      nodeVersion: this.getNodeVersion()
    });
    return sync(
      (result : SessionResult) => executeScript(session, this.resolveScript(session, 'node-install-pre.sh'), { vars }),
      (result : SessionResult) => executeScript(session, this.resolveScript(session, 'node-install.sh'), { vars }),
      (result : SessionResult) => executeScript(session, this.resolveScript(session, 'node-install-post.sh'), { vars })
    );
  }

  protected getNodeVersion() {
    return this.config.setup.node || '0.10.44';
  }
}
