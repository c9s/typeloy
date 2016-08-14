import {BaseAction} from './BaseAction';
import {SummaryMap} from '../SummaryMap';
import {Deployment} from '../Deployment';

export class StopAction extends BaseAction {
  public run(deployment : Deployment, sites : Array<string>) : Promise<Array<SummaryMap>> {
    return this.executePararell("stop", deployment, sites, [this.config.app.name]);
  };
}
