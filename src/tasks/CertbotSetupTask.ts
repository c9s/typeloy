import {SCRIPT_DIR, TEMPLATES_DIR, Task} from "./Task";
import {SetupTask} from "./SetupTask";
import {Config} from "../config";
import {Session, SessionResult, executeScript, run, sync} from "../Session";

const fs = require('fs');
const path = require('path');
const util = require('util');

export abstract class CertbotBaseTask extends Task {

  protected domain : string;

  protected email : string;

  constructor(config : Config, domain : string, email : string) {
    super(config);
    this.domain = domain;
    this.email = email;
  }
}

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
      executeScript(session, path.resolve(SCRIPT_DIR, 'certbot-renew.sh'), options),
      executeScript(session, path.resolve(SCRIPT_DIR, 'certbot-genssl.sh'), options)
    );
  }

  public build(taskList) {
    const args = this.extendArgs({
      'email':  this.email,
      'domain': this.domain,
    });
    taskList.executeScript('Renewing ssl keys', {
      'script': path.resolve(SCRIPT_DIR, 'certbot-renew.sh'),
      'vars': args,
    });
    taskList.executeScript('Updating pem key file', {
      'script': path.resolve(SCRIPT_DIR, 'certbot-genssl.sh'),
      'vars': args,
    });
  }
}

export class CertbotSetupTask extends CertbotBaseTask {

  public describe() : string {
    return 'Setting up certbot';
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
