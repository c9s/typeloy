import {Deployment} from '../Deployment';
import {BaseAction} from './BaseAction';
import {SessionManager, SessionManagerConfig, SessionGroup, SessionsMap} from '../SessionManager';
import {SummaryMap,SummaryMapResult, SummaryMapHistory, haveSummaryMapsErrors, hasSummaryMapErrors, mergeSummaryMap} from "../SummaryMap";

export class ReconfigAction extends BaseAction {
  public run(deployment: Deployment, sites : Array<string>) {
    var self = this;
    let sessionInfoList = [];

    let sitesPromise = Promise.resolve({});

    for (let i = 0 ; i < sites.length ; i++) {
      const site = sites[i];

      sitesPromise = sitesPromise.then((previousSummaryMap : SummaryMap) => {
        const siteConfig = this.getSiteConfig(site);
        const sessionsMap = this.createSiteSessionsMap(siteConfig);
        for (let os in sessionsMap) {
          let sessionGroup : SessionGroup = sessionsMap[os];
          sessionGroup.sessions.forEach( (session) => {
            const env = _.extend({},
                this.config.env || {},
                siteConfig.env || {},
                session._serverConfig.env || {});
            const taskListsBuilder = this.createTaskBuilderByOs(sessionGroup);
            const taskList = taskListsBuilder.reconfig(env, this.config);
            sessionInfoList.push({
              'taskList': taskList,
              'session': session
            });
          });
        }
        let sessionPromises = _.map(sessionInfoList, (sessionInfo) => {
          return new Promise<SummaryMap>(resolve => {
            sessionInfo.taskList.run(sessionInfo.session, (summaryMap : SummaryMap) => {
              resolve(summaryMap);
            });
          });
        });
        return Promise.all(sessionPromises).then((summaryMaps) => {
          return Promise.resolve(_.extend(previousSummaryMap, mergeSummaryMap(summaryMaps)));
        });
      });
    }
    return sitesPromise.then((summaryMap : SummaryMap) => {
      this.whenAfterCompleted(deployment, summaryMap);
      return Promise.resolve(summaryMap);
    });
  }
}


