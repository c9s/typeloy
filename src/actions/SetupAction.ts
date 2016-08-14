import {BaseAction} from './BaseAction';

import {Config} from '../config';
import {Deployment} from '../Deployment';
import {SummaryMap} from '../SummaryMap';

export class SetupAction extends BaseAction {
  public run(deployment : Deployment, sites : Array<string>) : Promise<SummaryMap> {
    this._showKadiraLink();
    return this.executePararell("setup", deployment, sites, [this.config]);
  }
}
