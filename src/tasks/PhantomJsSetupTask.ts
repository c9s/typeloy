import {SetupTask} from "./SetupTask";
import {Session, SessionResult, executeScript, sync} from "../Session";

export class PhantomJsSetupTask extends SetupTask {

  public describe() : string {
    return 'Installing PhantomJS';
  }

  public run(session : Session) : Promise<SessionResult> {
    return executeScript(session, this.resolveScript(session, 'phantomjs-install.sh'));
  }
}
