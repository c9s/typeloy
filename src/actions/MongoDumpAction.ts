import {BaseAction} from './BaseAction';

import {Config} from '../config';
import {SummaryMap} from '../SummaryMap';
import {Deployment} from '../Deployment';

export class MongoDumpAction extends BaseAction {
  public run(deployment : Deployment, sites : Array<string>) : Promise<SummaryMap> {
    return this.executePararell("mongoDump", deployment, sites, [this.config]);
  }
}
