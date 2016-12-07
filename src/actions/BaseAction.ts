import path = require('path');
import fs = require('fs');
import {Config, AppConfig, ServerConfig, SiteConfig, generateMeteorSettings} from '../config';
import LinuxTaskBuilder from "../TaskBuilder/LinuxTaskBuilder";
import {Deployment} from '../Deployment';
import {SessionManager, SessionManagerConfig, SessionGroup, SessionsMap} from '../SessionManager';
import {SummaryMap,SummaryMapResult, SummaryMapHistory, haveSummaryMapsErrors, hasSummaryMapErrors, reduceSummaryMaps, mergeSummaryMap} from "../SummaryMap";
import {PluginRunner} from "../PluginRunner";

import {Session, SessionRunner} from '../Session';

import {EventEmitter} from "events";

var _ = require('underscore');
var os = require('os');
require('colors');

const kadiraRegex = /^meteorhacks:kadira/m;

function copyFile(src, dest) {
  const content = fs.readFileSync(src, 'utf8');
  fs.writeFileSync(dest, content);
}

export class BaseAction extends EventEmitter {

  public config : Config;

  protected sessionManager : SessionManager;

  protected pluginRunner : PluginRunner;

  constructor(config : Config) {
    super();
    this.config = config;
    this.sessionManager = new SessionManager({
      "keepAlive": false 
    } as SessionManagerConfig);
    this.pluginRunner = new PluginRunner(config);
  }



  /**
  * Return the task builder by operating system name.
  */
  protected createTaskBuilderByOs(sessionGroup : SessionGroup) : LinuxTaskBuilder {
    return new LinuxTaskBuilder(sessionGroup);
  }

  protected getSiteConfig(siteName : string) : SiteConfig {
    let site = this.config.sites[siteName];
    if (!site) {
      throw new Error(`${siteName} is not found in the sites.`);
    }
    return site;
  }

  /**
   * Create sessions maps for only one site. It's possible to have more than
   * one servers in one site.
   *
   * the structure of sessions map is:
   *
   * [os:string] = SessionMap;
   *
  * @param {object} config (the mup config object)
  */
  protected createSiteSessionsMap(site : SiteConfig) : SessionsMap {
    let servers = site.servers;
    if (servers.length === 0) {
      throw new Error("Emtpy server list.");
    }
    return this.sessionManager.createSiteConnections(site);
  }

  protected executePararell(actionName : string, deployment : Deployment, sites : Array<string>, args? : Array<any>) : Promise<SummaryMap> {
    const runner = new SessionRunner;
    const sitePromises = _.map(sites, (site : string) => {
        const siteConfig = this.getSiteConfig(site);
        const sessionsMap = this.createSiteSessionsMap(siteConfig);

        const meteorSettings = generateMeteorSettings(this.config, site, siteConfig, deployment);
        console.log("Updated Meteor Settings:");
        console.log(JSON.stringify(meteorSettings, null, "  "));
        siteConfig.env['METEOR_SETTINGS'] = JSON.stringify(meteorSettings);


        const groupPromises : Array<Promise<SummaryMap>> = _.map(sessionsMap,
                (sessionGroup : SessionGroup) => {
                      const taskListsBuilder = this.createTaskBuilderByOs(sessionGroup);

                      const sessionPromises : Array<Promise<SummaryMap>> = _.map(sessionGroup.sessions, (session : Session) => {
                          const env = _.extend({},
                              this.config.env || {},
                              siteConfig.env || {},
                              session._serverConfig.env || {});
                          const tasks = taskListsBuilder[actionName].apply(taskListsBuilder, [this.config, env].concat(args || []));
                          return runner.execute(session, tasks, {});
                      });

                      // this.propagateTaskEvents(taskList);
                      return reduceSummaryMaps(sessionPromises);
                });
        return reduceSummaryMaps(groupPromises);
    });

    return reduceSummaryMaps(sitePromises).then((summaryMap : SummaryMap) => {
      this.whenAfterCompleted(deployment, summaryMap);
      return Promise.resolve(summaryMap);
    });
  }




  /**
   * Initalize a project from example files.
   */
  public init() {
    var destConfigJson = path.resolve('typeloy.json');
    var destSettingsJson = path.resolve('settings.json');
    if (fs.existsSync(destConfigJson) || fs.existsSync(destSettingsJson)) {
      console.error('A Project Already Exists');
      // XXX:
      process.exit(1);
    }

    let exampleJson = path.resolve(__dirname, '../example/typeloy.json');
    let exampleSettingsJson = path.resolve(__dirname, '../example/settings.json');

    copyFile(exampleJson, destConfigJson);
    copyFile(exampleSettingsJson, destSettingsJson);
    console.log('New Project Initialized!');
  }

  /**
  * After completed ....
  *
  * Right now we don't have things to do, just exit the process with the error
  * code.
  */
  public whenAfterCompleted(deployment : Deployment, summaryMap : SummaryMap) {
    this.pluginRunner.whenAfterCompleted(deployment);
    var errorCode = haveSummaryMapsErrors(summaryMap) ? 1 : 0;
    let promises;
    if (errorCode != 0) {
      this.whenFailure(deployment, summaryMap);
    } else {
      this.whenSuccess(deployment, summaryMap);
    }
  }

  public whenSuccess(deployment : Deployment, summaryMap) {
    return this.pluginRunner.whenSuccess(deployment);
  }

  public whenFailure(deployment : Deployment, summaryMap) {
    return this.pluginRunner.whenFailure(deployment);
  }



  protected propagateTaskEvents(taskList) {
    taskList.addListener('started', (taskId) => {
      this.emit('task.started', taskId);
    });
    taskList.addListener('success', (taskId) => {
      this.emit('task.success', taskId);
    });
    taskList.addListener('failed',  (err, taskId) => {
      this.emit('task.failed', taskId, err);
    });
  }


  protected error(a : any) {
    let message = a;
    let err = null;
    if (a instanceof Error) {
      err = a;
      message = a.message;
    }
    this.emit('error', message, err);
    console.error(message, err);
  }

  protected debug(a : any) {
    let message = a;
    if (typeof a === "object") {
      message = JSON.stringify(a, null, "  ");
    }
    this.emit('debug', message);
    console.log(message);
  }

  protected progress(message : string) {
    this.emit('progress', message);
    console.log(message);
  }

  protected log(message : string) {
    this.emit('log', message);
    console.log(message);
  }

}
