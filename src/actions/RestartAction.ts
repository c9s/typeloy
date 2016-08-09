import {Actions} from '../actions';
import {Config} from '../config';
import Deployment from '../Deployment';

export class RestartAction extends Actions {
  public run(deployment : Deployment) {
    return this._executePararell("restart", deployment, [this.config.appName]);
  }
}
