import {SCRIPT_DIR, TEMPLATES_DIR, Task} from "./Task";
import {SetupTask} from "./SetupTask";
import {Config} from "../config";
import {Session, SessionResult, executeScript, sync, copy} from "../Session";


const fs = require('fs');
const path = require('path');
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

  public build(taskList) {
    taskList.executeScript('Installing Stud', {
      script: path.resolve(SCRIPT_DIR, 'stud-install.sh')
    });
    this.configureStud(taskList, this.sslConfig.pem, this.sslConfig.backendPort);
  }

  public run(session : Session) : Promise<SessionResult> {
    const vars = this.extendArgs({});
    const pemFilePath = this.sslConfig.pem;
    const port = this.sslConfig.backendPort || 80;
    const backend = { host: '127.0.0.1', port: port };

    const tasks = [];
    tasks.push(executeScript(session, path.resolve(SCRIPT_DIR, 'stud-install.sh'), { vars }));

    // Creating upstart service entry
    tasks.push(copy(session, path.resolve(TEMPLATES_DIR, 'stud.init.conf'), '/etc/init/stud.conf', { vars }));

    tasks.push(copy(session, path.resolve(TEMPLATES_DIR, 'stud.service'), '/etc/systemd/system/stud.service', { vars }));

    if (pemFilePath) {
      tasks.push(copy(session, path.resolve(pemFilePath), this.deployPrefix + '/stud/ssl.pem', { vars }));
    }

    // Configuring stud
    tasks.push(copy(session, path.resolve(TEMPLATES_DIR, 'stud.conf'), this.deployPrefix + '/stud/stud.conf', {
      vars: { backend: util.format('[%s]:%d', backend.host, backend.port) }
    }));

    // Verifying SSL Configurations
    tasks.push(executeScript(session, path.resolve(SCRIPT_DIR, 'stud-restart.sh'), { vars }));
    return sync(tasks);
  }


  public configureStud(taskList, pemFilePath, port = 80) {
    const backend = { host: '127.0.0.1', port: port };

    taskList.copy('Creating upstart service entry', {
      src: path.resolve(TEMPLATES_DIR, 'stud.init.conf'),
      dest: '/etc/init/stud.conf',
      vars: this.extendArgs({ })
    });

    taskList.copy('Creating systemd service entry', {
      src: path.resolve(TEMPLATES_DIR, 'stud.service'),
      dest: '/etc/systemd/system/stud.service',
      vars: this.extendArgs({ })
    });

    if (pemFilePath) {
      taskList.copy('Sending SSL PEM key', {
        src: pemFilePath,
        dest: this.deployPrefix + '/stud/ssl.pem'
      });
    }

    taskList.copy('Configuring Stud', {
      src: path.resolve(TEMPLATES_DIR, 'stud.conf'),
      dest: this.deployPrefix + '/stud/stud.conf',
      vars: {
        backend: util.format('[%s]:%d', backend.host, backend.port)
      }
    });

    taskList.executeScript('Verifying SSL Configurations', {
      // restart will check the config
      'script': path.resolve(SCRIPT_DIR, 'stud-restart.sh'),
      'vars': this.extendArgs({}),
    });
  }
}
