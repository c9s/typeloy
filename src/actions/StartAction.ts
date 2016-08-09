import {BaseAction} from './BaseAction';

import Deployment from '../Deployment';

export class StartAction extends BaseAction {
  public run(deployment : Deployment) {
    return this.executePararell("start", deployment, [this.config.appName]);
  }
}
