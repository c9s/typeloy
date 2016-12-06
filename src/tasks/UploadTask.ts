import {DeployTask} from "./DeployTask";
import {Config} from "../config";
import {Session, SessionResult, executeScript, copy} from "../Session";


const fs = require('fs');
const path = require('path');
const util = require('util');

export class UploadTask extends DeployTask {

  protected srcPath : string;

  protected destPath : string;

  protected progress : boolean;

  constructor(config : Config, srcPath : string, destPath : string, progress : boolean = false) {
    super(config);
    this.srcPath = srcPath;
    this.destPath = destPath;
    this.progress = progress;
  }

  public describe() : string {
    return 'Uploading  ' + this.srcPath + ' to ' + this.destPath;
  }

  public run(session : Session) : Promise<SessionResult> {
    return copy(session,
      this.srcPath,
      this.destPath, { 'progressBar': this.progress });
  }
}
