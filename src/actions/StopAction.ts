import {Actions} from '../actions';
import Deployment from '../Deployment';

export class StopAction extends Actions {
  public run(deployment : Deployment) {
    return this._executePararell("stop", deployment, [this.config.appName]);
  };
}
