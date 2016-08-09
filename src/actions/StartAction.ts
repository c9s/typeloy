import {Actions} from '../actions';
import Deployment from '../Deployment';

export class StartAction extends Actions {
  public run(deployment : Deployment) {
    return this._executePararell("start", deployment, [this.config.appName]);
  }
}
