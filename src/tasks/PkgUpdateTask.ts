import {Task} from "./Task";
import {Session, SessionResult, executeScript, sync} from "../Session";

export class PkgUpdateTask extends Task {

  public describe() : string {
    return 'Updating package index';
  }

  public run(session : Session) : Promise<SessionResult> {
    return executeScript(session, this.resolveScript(session, 'update-packages.sh'));
  }
}
