import {BaseAction} from './BaseAction';

import {Config} from '../config';
import {SummaryMap} from '../SummaryMap';
import {Deployment} from '../Deployment';

export class RestartAction extends BaseAction {
  public run(deployment : Deployment, sites : Array<string>) : Promise<Array<SummaryMap>> {
    return this.executePararell("restart", deployment, sites, [this.config.app.name]);
  }
}
