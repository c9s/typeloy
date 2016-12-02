import {SCRIPT_DIR, TEMPLATES_DIR, Task} from "./Task";
import {SetupTask} from "./SetupTask";
import {Config} from "../config";
import {Session, SessionResult, executeScript, sync} from "../Session";
import {CertbotBaseTask} from "./CertbotBaseTask";

const path = require('path');

export class CertbotRenewTask extends CertbotBaseTask {

  public describe() : string {
    return 'Renewing SSL with Certbot';
  }

  public run(session : Session) : Promise<SessionResult> {
    const options = { 'vars': this.extendArgs({
      'email':  this.email,
      'domain': this.domain,
    }) };
    return sync(
      executeScript(session, path.resolve(SCRIPT_DIR, 'certbot/renew.sh'), options),
      executeScript(session, path.resolve(SCRIPT_DIR, 'certbot/genssl.sh'), options)
    );
  }
}
