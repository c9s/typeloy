import {SetupTask} from "./SetupTask";
import {Session, SessionResult, executeScript, sync} from "../Session";

export class PhantomJsSetupTask extends SetupTask {

  public describe() : string {
    return 'Installing PhantomJS';
  }

  public run(session : Session) : Promise<SessionResult> {
    const vars = this.extendArgs({});
    return sync(
      (result : SessionResult) => executeScript(session, this.resolveScript(session, 'phantomjs-install-pre.sh'), { vars }),
      (result : SessionResult) => executeScript(session, this.resolveScript(session, 'phantomjs-install.sh'), { vars })
    );
  }
}
