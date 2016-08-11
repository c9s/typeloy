import {BaseAction} from './BaseAction';
import {SummaryMap} from '../SummaryMap';
import {Deployment} from '../Deployment';

export class StartAction extends BaseAction {
  public run(deployment : Deployment, site : string) : Promise<Array<SummaryMap>> {
    return this.executePararell("start", deployment, site, [this.config.app.name]);
  }
}
