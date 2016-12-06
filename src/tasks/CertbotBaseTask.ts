import {Task} from "./Task";
import {SetupTask} from "./SetupTask";
import {Config} from "../config";
import {Session, SessionResult, executeScript, sync} from "../Session";

export abstract class CertbotBaseTask extends Task {

  protected domain : string;

  protected email : string;

  constructor(config : Config, domain : string, email : string) {
    super(config);
    this.domain = domain;
    this.email = email;
  }
}
