import {BaseAction} from './BaseAction';

import {Config} from '../config';
import {SummaryMap} from '../SummaryMap';
import {Deployment} from '../Deployment';

export class RestartAction extends BaseAction {
  public run(deployment : Deployment, site : string) : Promise<Array<SummaryMap>> {
    return this.executePararell("restart", deployment, site, [this.config.app.name]);
  }
}
