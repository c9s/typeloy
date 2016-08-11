import {Deployment} from '../Deployment';
import {BaseAction} from './BaseAction';
import {SessionManager, SessionManagerConfig, SessionGroup, SessionsMap} from '../SessionManager';
import {SummaryMap,SummaryMapResult, SummaryMapHistory, haveSummaryMapsErrors, hasSummaryMapErrors} from "../SummaryMap";

export class ReconfigAction extends BaseAction {
  public run(deployment: Deployment, site : string) {
    var self = this;
    let sessionInfoList = [];

    let siteConfig = this.getSiteConfig(site);
    let sessionsMap = this.createSiteSessionsMap(siteConfig);
    for (let os in sessionsMap) {
      let sessionGroup : SessionGroup = sessionsMap[os];
      sessionGroup.sessions.forEach( (session) => {
        var env = _.extend({}, this.config.env, session._serverConfig.env);
        let taskListsBuilder = this.getTaskBuilderByOs(sessionGroup.os);
        var taskList = taskListsBuilder.reconfig(env, this.config.appName);
        sessionInfoList.push({
          'taskList': taskList,
          'session': session
        });
      });
    }
    let promises = _.map(sessionInfoList, (sessionInfo) => {
      return new Promise<SummaryMap>(resolve => {
        sessionInfo.taskList.run(sessionInfo.session, (summaryMap : SummaryMap) => {
          resolve(summaryMap);
        });
      });
    });
    return Promise.all(promises).then((mapResult : Array<SummaryMap>) => {
      this.whenAfterCompleted(deployment, mapResult);
    });
  }
}


