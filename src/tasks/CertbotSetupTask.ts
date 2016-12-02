import {SCRIPT_DIR, TEMPLATES_DIR, Task} from "./Task";
import {SetupTask} from "./SetupTask";
import {Config} from "../config";
import {Session, SessionResult, executeScript, sync} from "../Session";
import {CertbotBaseTask} from "./CertbotBaseTask";

const path = require('path');

export class CertbotSetupTask extends CertbotBaseTask {

  public describe() : string {
    return 'Setting up certbot';
  }

  public run(session : Session) : Promise<SessionResult> {
    const options = { 'vars': this.extendArgs({
      'email':  this.email,
      'domain': this.domain,
    }) };
    return sync(
      executeScript(session, this.resolveScript(session, 'certbot-install.sh'), options),
      executeScript(session, this.resolveScript(session, 'certbot-genssl.sh'), options)
    );
  }

  public build(taskList) {
    taskList.executeScript('Installing certbot', {
      'script': path.resolve(SCRIPT_DIR, 'certbot-install.sh'),
      'vars': this.extendArgs({
        'email': this.email,
        'domain': this.domain,
      })
    });
    taskList.executeScript('Generating pem key file', {
      'script': path.resolve(SCRIPT_DIR, 'certbot-genssl.sh'),
      'vars': this.extendArgs({
        'email': this.email,
        'domain': this.domain,
      })
    });
  }
}
