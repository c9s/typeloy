import {BaseAction} from './BaseAction';
import {SummaryMap} from '../SummaryMap';
import {Deployment} from '../Deployment';

export class StartAction extends BaseAction {
  public run(deployment : Deployment) : Promise<Array<SummaryMap>> {
    return this.executePararell("start", deployment, [this.config.appName]);
  }
}
