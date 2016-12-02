
import {Deployment} from '../Deployment';
import {BaseAction} from './BaseAction';
import {SessionManager, SessionManagerConfig, SessionGroup, SessionsMap} from '../SessionManager';
import {SummaryMap,SummaryMapResult, SummaryMapHistory, haveSummaryMapsErrors, hasSummaryMapErrors, mergeSummaryMap} from "../SummaryMap";

const _ = require('underscore');

export class ReconfigAction extends BaseAction {
  public run(deployment: Deployment, sites : Array<string>) {
    return this.executePararell("reconfig", deployment, sites);
  }
}


