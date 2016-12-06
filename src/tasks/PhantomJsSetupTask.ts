import {SetupTask} from "./SetupTask";
import {Session, SessionResult, executeScript, sync} from "../Session";

export class PhantomJsSetupTask extends SetupTask {

  public describe() : string {
    return 'Installing PhantomJS';
  }

  public run(session : Session) : Promise<SessionResult> {
    const vars = this.extendArgs({});
    return sync(
      executeScript(session, this.resolveScript(session, 'phantomjs-install-pre.sh'), { vars }),
      executeScript(session, this.resolveScript(session, 'phantomjs-install.sh'), { vars })
    );
  }
}
