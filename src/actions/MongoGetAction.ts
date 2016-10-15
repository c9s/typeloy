import {BaseAction} from './BaseAction';

import {Config} from '../config';
import {SummaryMap} from '../SummaryMap';
import {Deployment} from '../Deployment';

export class MongoGetAction extends BaseAction {
  public run(deployment : Deployment, site : string, file : string) : Promise<SummaryMap> {
    return this.executePararell("mongoGet", deployment, [site], [this.config, file]);
  }
}
