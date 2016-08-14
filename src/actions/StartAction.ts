import {BaseAction} from './BaseAction';
import {SummaryMap} from '../SummaryMap';
import {Deployment} from '../Deployment';

export class StartAction extends BaseAction {
  public run(deployment : Deployment, sites : Array<string>) : Promise<SummaryMap> {
    return this.executePararell("start", deployment, sites, [this.config]);
  }
}
