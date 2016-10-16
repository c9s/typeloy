import {BaseAction} from './BaseAction';
import {Config} from '../config';
import {Deployment} from '../Deployment';
import {Session} from '../Session';
import {SessionManager, SessionManagerConfig, SessionGroup, SessionsMap} from '../SessionManager';
import {SummaryMap,SummaryMapResult, SummaryMapHistory, haveSummaryMapsErrors, hasSummaryMapErrors, mergeSummaryMap} from "../SummaryMap";

const _ = require('underscore');

export interface LogsOptions {
  tail?: boolean;
  init?: string;
  onStdout: any;
  onStderr: any;
}

export class LogsAction extends BaseAction {

  public run(deployment : Deployment, sites : Array<string>, options : LogsOptions) : Promise<SummaryMap> {
    const self = this;
    let sitesPromise = Promise.resolve({});
    for (let i = 0; i < sites.length; i++) {
        const site = sites[i];
        sitesPromise = sitesPromise.then(() => {
            const siteConfig = this.getSiteConfig(site);
            const sessionsMap = this.createSiteSessionsMap(siteConfig);

            const taskPromises = _.map(sessionsMap, (sessionGroup : SessionGroup, os : string) => {
                const sessionPromises = sessionGroup.sessions.map((session : Session) => {
                    return new Promise<SummaryMap>(resolve => {
                        const hostPrefix = `(${site}) [${session._host}] `;
                        const taskListsBuilder = this.createTaskBuilderByOs(sessionGroup);
                        const taskList = taskListsBuilder.logs(this.config, hostPrefix, options);
                        this.propagateTaskEvents(taskList);
                        taskList.run(sessionGroup.sessions, (summaryMap : SummaryMap) => {
                            resolve(summaryMap);
                        });
                    });
                });
                return Promise.all(sessionPromises);
            });
            return Promise.all(taskPromises);
        });
    }
    return sitesPromise;
  }
}
