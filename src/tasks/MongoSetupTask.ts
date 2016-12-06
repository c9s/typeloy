import {SetupTask} from "./SetupTask";
import {Session, SessionResult, executeScript} from "../Session";

export class MongoSetupTask extends SetupTask {

  public describe() : string {
    return 'Setting up MongoDB configuration';
  }

  public run(session : Session) : Promise<SessionResult> {
    return executeScript(session, this.resolveScript(session, 'mongo-install.sh'));
  }
}
