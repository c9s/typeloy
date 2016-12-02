import {BaseAction} from './BaseAction';

import {Config} from '../config';
import {SummaryMap} from '../SummaryMap';
import {Deployment} from '../Deployment';

export class MongoRestoreAction extends BaseAction {
  public run(deployment : Deployment, site : string, localFile : string) : Promise<SummaryMap> {
    return this.executePararell("mongoRestore", deployment, [site], [localFile]);
  }
}
