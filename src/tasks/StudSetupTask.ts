import {SCRIPT_DIR, TEMPLATES_DIR, Task} from "./Task";
import {SetupTask} from "./SetupTask";
import {Config} from "../Config";

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
    this.installStud(taskList);
    this.configureStud(taskList, this.sslConfig.pem, this.sslConfig.backendPort);
  }

  public installStud(taskList) {
    taskList.executeScript('Installing Stud', {
      script: path.resolve(SCRIPT_DIR, 'stud-install.sh')
    });
  }

  public configureStud(taskList, pemFilePath, port = 80) {
    const backend = {host: '127.0.0.1', port: port};

    taskList.copy('Creating upstart service entry', {
      src: path.resolve(TEMPLATES_DIR, 'stud.init.conf'),
      dest: '/etc/init/stud.conf'
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
