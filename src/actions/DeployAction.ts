import {BaseAction} from './BaseAction';
import {Config, generateMeteorSettings} from '../config';
import {Deployment} from '../Deployment';
import {Session, SessionRunner} from '../Session';
import {SessionManager, SessionManagerConfig, SessionGroup, SessionsMap} from '../SessionManager';
import {SummaryMap,SummaryMapResult, SummaryMapHistory, haveSummaryMapsErrors, hasSummaryMapErrors, mergeSummaryMap} from "../SummaryMap";
import {CmdDeployOptions} from '../options';
import {MeteorBuilder} from '../MeteorBuilder';

import fs = require('fs');
import os = require('os');

const uuid = require('uuid');
const propagate = require('propagate');
const format = require('util').format;
const extend = require('util')._extend;
const path = require('path');
const rimraf = require('rimraf');
const _ = require('underscore');

const getDefaultBuildDirName = function(appName : string, tag : string) : string {
  return (appName || "app") + "-" + (tag || uuid.v4());
};

export class DeployAction extends BaseAction {

  protected deploySite(deployment : Deployment, site : string, bundlePath : string) : Promise<SummaryMap> {
      const siteConfig = this.getSiteConfig(site);
      const sessionsMap = this.createSiteSessionsMap(siteConfig);
      this.log(`Connecting to the ${site} servers: [${ _.map(siteConfig.servers, (server) => server.host).join(', ')}]`);

      const meteorSettings = generateMeteorSettings(this.config, site, siteConfig, deployment);
      console.log("Updated Meteor Settings:");
      console.log(JSON.stringify(meteorSettings, null, "  "));
      siteConfig.env['METEOR_SETTINGS'] = JSON.stringify(meteorSettings);

      // An array of Promise<SummaryMap> for sites server
      const groupPromises : Array<Promise<SummaryMap>> 
        = _.map(sessionsMap, (sessionGroup : SessionGroup) => {
          const taskBuilder = this.createTaskBuilderByOs(sessionGroup);


          const sessionPromises : Array<Promise<SummaryMap>> = _.map(sessionGroup.sessions, (session : Session) : Promise<SummaryMap> => {
              const env = _.extend({},
                  this.config.env || {},
                  siteConfig.env || {},
                  session._serverConfig.env || {});
              if (typeof env['ROOT_URL'] === "undefined") {
                console.warn("**WARNING** ROOT_URL is undefined.");
              }
              const tasks = taskBuilder.deploy(this.config, bundlePath, env);
              const runner = new SessionRunner;
              return runner.execute(session, tasks, {});
          });
          return Promise.all(sessionPromises).then((summaryMaps : Array<SummaryMap>) => {
              return Promise.resolve(mergeSummaryMap(summaryMaps));
          });
      });
      return Promise.all(groupPromises).then((summaryMaps : Array<SummaryMap>) => {
          return Promise.resolve(mergeSummaryMap(summaryMaps));
      });
  }

  public run(deployment : Deployment, sites : Array<string>, options : CmdDeployOptions = {} as CmdDeployOptions) {
    const appName = this.config.app.name || "app";

    // /tmp/shaka-/Users/c9s/src/work/kaneoh/delivery/shaka1/shaka1/app/bundle.tar.gz
    const buildLocation = options.buildDir 
                          || process.env.METEOR_BUILD_DIR 
                          || path.resolve(os.tmpdir(), getDefaultBuildDirName(appName, deployment.tag));
    const bundlePath = options.bundleFile || path.resolve(buildLocation, 'bundle.tar.gz');

    this.debug(`Deployment Tag: ${deployment.tag}`);
    this.debug(`Build Location: ${buildLocation}`);
    this.debug(`Bundle Path: ${bundlePath}`);

    const builder = new MeteorBuilder(this.config);
    propagate(builder, this);

    return builder.buildApp(this.config.app.directory, buildLocation, bundlePath, () => {
      this.whenBeforeBuilding(deployment);
    }).then(() => {
      // We only want to fire once for now.
      this.whenBeforeDeploying(deployment);

      const sitesDeploy = _.map(sites, (site : string) => this.deploySite(deployment, site, bundlePath));
      return Promise.all(sitesDeploy).then((summaryMaps : Array<any>) => {
          return Promise.resolve(mergeSummaryMap(summaryMaps));
      }).then((summaryMap : SummaryMap) => {
        this.pluginRunner.whenAfterDeployed(deployment);
        if (options.clean) {
          this.log(`Cleaning up ${buildLocation}`);
          rimraf.sync(buildLocation);
        }
        return Promise.resolve(summaryMap);
      }).catch((reason) => {
        console.error("Failed", reason);
        return Promise.reject(reason);
      });
    });
  }

  protected whenBeforeBuilding(deployment : Deployment) {
    return this.pluginRunner.whenBeforeBuilding(deployment);
  }

  protected whenBeforeDeploying(deployment : Deployment) {
    return this.pluginRunner.whenBeforeDeploying(deployment);
  }

  /**
   * Return a callback, which is used when after deployed, clean up the files.
   */
  public whenAfterDeployed(deployment : Deployment, summaryMap) {
    return this.whenAfterCompleted(deployment, summaryMap);
  }
}
