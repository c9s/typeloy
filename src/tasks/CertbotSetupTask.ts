import {SCRIPT_DIR, TEMPLATES_DIR, Task} from "./Task";
import {SetupTask} from "./SetupTask";
import {Config} from "../Config";

const fs = require('fs');
const path = require('path');
const util = require('util');

export class CertbotSetupTask extends SetupTask {

  protected domain : string;

  protected email : string;

  constructor(config : Config, domain : string, email : string) {
    super(config);
    this.domain = domain;
    this.email = email;
  }

  public describe() : string {
    return 'Setting up certbot';
  }

  public build(taskList) {
    taskList.executeScript('Installing certbot', {
      'script': path.resolve(SCRIPT_DIR, 'certbot-install.sh'),
      'vars': {
        'email': this.email,
        'domain': this.domain,
      }
    });
  }
}
