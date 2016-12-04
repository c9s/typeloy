import {SCRIPT_DIR, TEMPLATES_DIR, Task} from "./Task";
import {SetupTask} from "./SetupTask";
import {Config} from "../config";
import {Session, SessionResult, executeScript, sync, copy} from "../Session";

const util = require('util');

export class StudSetupTask extends SetupTask {

  protected sslConfig;

  constructor(config : Config, sslConfig) {
    super(config);
    this.sslConfig = sslConfig || {};
  }

  public describe() : string {
    return 'Setting up stud';
  }

  public run(session : Session) : Promise<SessionResult> {
    const vars = this.extendArgs({});
    const pemFilePath = this.sslConfig.pem;
    const port = this.sslConfig.backendPort || 80;
    const backend = { host: '127.0.0.1', port: port };

    const tasks = [];
    tasks.push(executeScript(session, this.resolveScript(session, 'stud-install.sh'), { vars }));

    // Creating upstart service entry
    tasks.push(copy(session, this.resolveTemplate(session, 'stud.init.conf'), '/etc/init/stud.conf', { vars }));

    tasks.push(copy(session, this.resolveTemplate(session, 'stud.service'), '/etc/systemd/system/stud.service', { vars }));

    if (pemFilePath) {
      tasks.push(copy(session, this.resolveTemplate(session, pemFilePath), this.deployPrefix + '/stud/ssl.pem', { vars }));
    }

    // Configuring stud
    tasks.push(copy(session, this.resolveTemplate(session, 'stud.conf'), this.deployPrefix + '/stud/stud.conf', {
      vars: { backend: util.format('[%s]:%d', backend.host, backend.port) }
    }));
    return sync(tasks);
  }
}
