import {Actions} from '../actions';
import {Config} from '../config';
import Deployment from '../Deployment';

export class SetupAction extends Actions {
  public run(deployment : Deployment) : Promise<any> {
    this._showKadiraLink();
    return this._executePararell("setup", deployment, [this.config]);
  }
}
