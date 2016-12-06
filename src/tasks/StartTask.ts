import {Task} from "./Task";
import {Session, SessionResult, executeScript, sync} from "../Session";

export class StartTask extends Task {

  public describe() : string {
    return `Start ${this.config.app.name}`;
  }

  public run(session : Session) : Promise<SessionResult> {
    return executeScript(session,
        this.resolveScript(session, 'service/start'), { 'vars': this.extendArgs({ })
      });
  }
}
