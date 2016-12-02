import {SCRIPT_DIR, TEMPLATES_DIR, Task} from "./Task";
import {Session, SessionResult, executeScript, sync} from "../Session";

const fs = require('fs');
const path = require('path');
const util = require('util');

export class PkgUpdateTask extends Task {

  public describe() : string {
    return 'Updating package index';
  }

  public run(session : Session) : Promise<SessionResult> {
    return executeScript(session, this.resolveScript(session, 'update-packages.sh'));
  }
}
