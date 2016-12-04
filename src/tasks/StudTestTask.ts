import {SetupTask} from "./SetupTask";
import {Session, SessionResult, executeScript} from "../Session";

export class StudTestTask extends SetupTask {

  public describe() : string {
    return 'Verifying stud SSL Configurations';
  }

  public run(session : Session) : Promise<SessionResult> {
    const vars = this.extendArgs({});
    return executeScript(session, this.resolveScript(session, 'stud-test.sh'), { vars });
  }
}
