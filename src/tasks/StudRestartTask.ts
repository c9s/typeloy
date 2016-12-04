import {SetupTask} from "./SetupTask";
import {Session, SessionResult, executeScript} from "../Session";

export class StudRestartTask extends SetupTask {

  public describe() : string {
    return 'Restarting stud SSL Configurations';
  }

  public run(session : Session) : Promise<SessionResult> {
    const vars = this.extendArgs({});
    return executeScript(session, this.resolveScript(session, 'stud-restart.sh'), { vars });
  }
}
