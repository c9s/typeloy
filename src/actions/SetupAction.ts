import {BaseAction} from './BaseAction';

import {Config} from '../config';
import {Deployment} from '../Deployment';

export class SetupAction extends BaseAction {
  public run(deployment : Deployment) : Promise<any> {
    this._showKadiraLink();
    return this.executePararell("setup", deployment, [this.config]);
  }
}
