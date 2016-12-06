import {SetupTask} from "./SetupTask";
import {Session, SessionResult, executeScript, sync, copy} from "../Session";


const fs = require('fs');
const path = require('path');
const util = require('util');

export class MeteorEnvSetupTask extends SetupTask {

  public describe() : string {
    return 'Setting up environment for meteor application';
  }

  public run(session : Session) : Promise<SessionResult> {
    return sync(
      executeScript(session,
          this.resolveScript(session, 'setup-env.sh'),
          { vars: this.extendArgs({}) }
      ),
      copy(session,
           this.resolveTemplate(session, 'functions.sh'),
           this.deployPrefix + '/lib/functions.sh',
           { vars: this.extendArgs({ }) }
      )
    );
  }
}
