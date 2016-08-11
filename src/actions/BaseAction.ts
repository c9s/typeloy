import path = require('path');
import fs = require('fs');
import {Config, AppConfig, ServerConfig, SiteConfig} from '../config';
import LinuxTaskBuilder from "../TaskBuilder/LinuxTaskBuilder";
import SunOSTaskBuilder from "../TaskBuilder/SunOSTaskBuilder";
import {TaskBuilder} from "../TaskBuilder/BaseTaskBuilder";
import {Deployment} from '../Deployment';
import {SessionManager, SessionManagerConfig, SessionGroup, SessionsMap} from '../SessionManager';
import {SummaryMap,SummaryMapResult, SummaryMapHistory, haveSummaryMapsErrors, hasSummaryMapErrors} from "../SummaryMap";
import {PluginRunner} from "../PluginRunner";

import _ = require('underscore');

var os = require('os');
require('colors');

const kadiraRegex = /^meteorhacks:kadira/m;

export class BaseAction {

  public cwd : string;

  public config : Config;

  protected sessionManager : SessionManager;

  protected pluginRunner : PluginRunner;

  constructor(config : Config, cwd : string) {
    this.cwd = cwd;
    this.config = config;

    this.sessionManager = new SessionManager({
      "keepAlive": false 
    } as SessionManagerConfig);

    this.pluginRunner = new PluginRunner(config, cwd);

    // Get settings.json into env,
    // The METEOR_SETTINGS can be used for setting up meteor application without passing "--settings=...."
    //
    // Here is the guide of using METEOR_SETTINGS
    // https://themeteorchef.com/snippets/making-use-of-settings-json/#tmc-using-settingsjson
    //
    // @see http://joshowens.me/environment-settings-and-security-with-meteor-js/

    if (this.config.app.settings) {

    }

    let setttingsJsonPath = path.resolve(this.cwd, 'settings.json');
    if (fs.existsSync(setttingsJsonPath)) {
      this.config.env['METEOR_SETTINGS'] = JSON.stringify(require(setttingsJsonPath));
    }
  }


  /**
  * Return the task builder by operating system name.
  */
  protected getTaskBuilderByOs(os:string) : TaskBuilder {
    switch (os) {
      case "linux":
        return new LinuxTaskBuilder;
      case "sunos":
        return new SunOSTaskBuilder;
      default:
        throw new Error("Unsupported operating system.");
    }
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
    return this.sessionManager.createOsMap(servers);
  }

  // XXX: Extract this to Kadira plugin
  protected _showKadiraLink() {
    var versionsFile = path.join(this.config.app.directory, '.meteor/versions');
    if (fs.existsSync(versionsFile)) {
      var packages = fs.readFileSync(versionsFile, 'utf-8');
      var hasKadira = kadiraRegex.test(packages);
      if(!hasKadira) {
        console.log(
          "“ Checkout " + "Kadira" + "!"+
          "\n  It's the best way to monitor performance of your app."+
          "\n  Visit: " + "https://kadira.io/mup" + " ”\n"
        );
      }
    }
  }

  protected executePararell(actionName : string, deployment : Deployment, site : string, args) : Promise<Array<SummaryMap>> {
    let siteConfig = this.getSiteConfig(site);
    let sessionsMap = this.createSiteSessionsMap(siteConfig);
    let sessionInfoList = _.values(sessionsMap);
    let promises = _.map(sessionInfoList,
      (sessionGroup:SessionGroup) => {
        return new Promise<SummaryMap>(resolve => {
          let taskListsBuilder = this.getTaskBuilderByOs(sessionGroup.os);
          let taskList = taskListsBuilder[actionName].apply(taskListsBuilder, args);
          taskList.run(sessionGroup.sessions, (summaryMap:SummaryMap) => {
            resolve(summaryMap);
          });
        });
      });
    return new Promise<Array<SummaryMap>>(resolveCompleted => {
      Promise.all(promises).then((mapResults : Array<SummaryMap>) => {
        this.whenAfterCompleted(deployment, mapResults);
        resolveCompleted(mapResults);
      });
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
    function copyFile(src, dest) {
      var content = fs.readFileSync(src, 'utf8');
      fs.writeFileSync(dest, content);
    }
  }


  /**
  * After completed ....
  *
  * Right now we don't have things to do, just exit the process with the error
  * code.
  */
  public whenAfterCompleted(deployment : Deployment, summaryMaps : Array<SummaryMap>) {
    this.pluginRunner.whenAfterCompleted(deployment);
    var errorCode = haveSummaryMapsErrors(summaryMaps) ? 1 : 0;
    let promises;
    if (errorCode != 0) {
      this.whenFailure(deployment, summaryMaps);
    } else {
      this.whenSuccess(deployment, summaryMaps);
    }
  }

  public whenSuccess(deployment : Deployment, summaryMaps) {
    return this.pluginRunner.whenSuccess(deployment);
  }

  public whenFailure(deployment : Deployment, summaryMaps) {
    return this.pluginRunner.whenFailure(deployment);
  }

}
