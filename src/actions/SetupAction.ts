import {BaseAction} from './BaseAction';

import {Config} from '../config';
import {Deployment} from '../Deployment';

export class SetupAction extends BaseAction {
  public run(deployment : Deployment, site : string) : Promise<any> {
    this._showKadiraLink();
    return this.executePararell("setup", deployment, site, [this.config]);
  }
}
