import {Task} from "./Task";
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
      (result : SessionResult) => executeScript(session, this.resolveScript(session, 'certbot/renew.sh'), options),
      (result : SessionResult) => executeScript(session, this.resolveScript(session, 'certbot/genssl.sh'), options)
    );
  }
}
