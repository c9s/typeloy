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
}

function journalctl(config : Config, tailOptions) {
  return `sudo journalctl -u ${config.app.name}.service --since today ${tailOptions.join(' ')}`;
}

export class LogsAction extends BaseAction {

  public run(deployment : Deployment, sites : Array<string>, options : LogsOptions) : Promise<SummaryMap> {

    const self = this;
    let tailOptions = [];
    if (options.tail) {
      tailOptions.push('-f');
    }
    const tailOptionArgs = tailOptions.join(' ');

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
                        const taskList = taskListsBuilder.logs(this.config, hostPrefix, tailOptionArgs);
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
