import {BaseAction} from './BaseAction';

import {Config} from '../config';
import {Deployment} from '../Deployment';

export class SetupAction extends BaseAction {
  public run(deployment : Deployment, sites : Array<string>) : Promise<any> {
    this._showKadiraLink();
    return this.executePararell("setup", deployment, sites, [this.config]);
  }
}
