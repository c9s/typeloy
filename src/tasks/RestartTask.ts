import {Task} from "./Task";
import {Session, SessionResult, executeScript, sync} from "../Session";

export class RestartTask extends Task {

  public describe() : string {
    return `Restart ${this.config.app.name}`;
  }

  public run(session : Session) : Promise<SessionResult> {
    return executeScript(session,
                         this.resolveScript(session, 'service/restart'),
                         {
                            'vars': this.extendArgs({ })
                         });
  }

}
