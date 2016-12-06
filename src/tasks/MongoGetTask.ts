import {SetupTask} from "./SetupTask";
import {Session, SessionResult, executeScript, download, sync} from "../Session";

export class MongoGetTask extends SetupTask {

  protected filename;

  constructor(config, filename : string) {
    super(config);
    this.filename = filename;
  }

  public describe() : string {
    return 'Get latest mongo archive';
  }

  public run(session : Session) : Promise<SessionResult> {
    return download(session, 
      this.deployPrefix + '/db/archive/latest',
      this.filename, {
        "progressBar": true
      });
  }
}
