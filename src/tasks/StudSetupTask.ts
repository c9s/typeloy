import {SCRIPT_DIR, TEMPLATES_DIR, Task} from "./Task";
import {SetupTask} from "./SetupTask";
import {Config} from "../Config";

const fs = require('fs');
const path = require('path');
const util = require('util');

export class StudSetupTask extends SetupTask {

  public describe() : string {
    return 'Setting up stud';
  }

  public build(taskList) {
    this.installStud(taskList);
    this.configureStud(taskList, this.config.ssl.pem, this.config.ssl.backendPort);
  }

  public installStud(taskList) {
    taskList.executeScript('Installing Stud', {
      script: path.resolve(SCRIPT_DIR, 'install-stud.sh')
    });
  }

  public configureStud(taskList, pemFilePath, port) {
    const backend = {host: '127.0.0.1', port: port};
    taskList.copy('Configuring Stud for Upstart', {
      src: path.resolve(TEMPLATES_DIR, 'stud.init.conf'),
      dest: '/etc/init/stud.conf'
    });

    taskList.copy('Configuring SSL', {
      src: pemFilePath,
      dest: this.deployPrefix + '/stud/ssl.pem'
    });


    taskList.copy('Configuring Stud', {
      src: path.resolve(TEMPLATES_DIR, 'stud.conf'),
      dest: this.deployPrefix + '/stud/stud.conf',
      vars: {
        backend: util.format('[%s]:%d', backend.host, backend.port)
      }
    });

    taskList.execute('Verifying SSL Configurations (ssl.pem)', {
      'command': `stud --test --config=${this.deployPrefix}/stud/stud.conf`
    });

    //restart stud
    taskList.execute('Starting Stud', {
      'command': '(sudo stop stud || :) && (sudo start stud || :)'
    });
  }
}
