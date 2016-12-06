import {Task} from "./Task";
import {Session, SessionResult, executeScript, sync} from "../Session";

export class StopTask extends Task {

  public describe() : string {
    return `Stop ${this.config.app.name}`;
  }

  public run(session : Session) : Promise<SessionResult> {
    const vars = this.extendArgs({ });
    return executeScript(session,
      this.resolveScript(session, 'service/stop'), {
        'vars': vars });
  }
}
