import {BaseAction} from './BaseAction';
import {Config} from '../config';
import {Deployment} from '../Deployment';
import {Session} from '../Session';
import {SessionManager, SessionManagerConfig, SessionGroup, SessionsMap} from '../SessionManager';
import {SummaryMap,SummaryMapResult, SummaryMapHistory, haveSummaryMapsErrors, hasSummaryMapErrors, mergeSummaryMap} from "../SummaryMap";
import {CmdDeployOptions} from '../options';
import {MeteorBuilder} from '../MeteorBuilder';

import fs = require('fs');
import os = require('os');
var uuid = require('uuid');
var propagate = require('propagate');
var format = require('util').format;
var extend = require('util')._extend;
var path = require('path');
var rimraf = require('rimraf');
var _ = require('underscore');


export class DeployAction extends BaseAction {

  public run(deployment : Deployment, sites : Array<string>, options : CmdDeployOptions = {} as CmdDeployOptions) {

    const appConfig = this.config.app;
    const appName = appConfig.name;

    this._showKadiraLink();

    const getDefaultBuildDirName = function(appName : string, tag : string) : string {
      return (appName || "meteor") + "-" + (tag || uuid.v4());
    };

    const buildLocation = options.buildDir 
                          || process.env.METEOR_BUILD_DIR 
                          || path.resolve(os.tmpdir(), getDefaultBuildDirName(appName, deployment.tag));
    const bundlePath = options.bundleFile || path.resolve(buildLocation, 'bundle.tar.gz');

    this.debug(`Deployment Tag: ${deployment.tag}`);
    this.debug(`Build Location: ${buildLocation}`);
    this.debug(`Bundle Path: ${bundlePath}`);

    const deployCheckWaitTime = this.config.deploy.checkDelay;
    const builder = new MeteorBuilder(this.config);

    propagate(builder, this);

    return builder.buildApp(appConfig.directory, buildLocation, bundlePath, () => {
      this.whenBeforeBuilding(deployment);
    }).then(() => {
      // We only want to fire once for now.
      this.whenBeforeDeploying(deployment);

      let sitesPromise = Promise.resolve({});
      for (let i = 0; i < sites.length ; i++) {
        const site = sites[i];
        sitesPromise = sitesPromise.then((previousSummaryMap : SummaryMap) => {
          const siteConfig = this.getSiteConfig(site);
          const sessionsMap = this.createSiteSessionsMap(siteConfig);
          this.log(`Connecting to the ${site} servers: [${ _.map(siteConfig.servers, (server) => server.host).join(', ')}]`);

          // Get settings.json into env,
          // The METEOR_SETTINGS can be used for setting up meteor application without passing "--settings=...."
          //
          // Here is the guide of using METEOR_SETTINGS
          // https://themeteorchef.com/snippets/making-use-of-settings-json/#tmc-using-settingsjson
          //
          // @see http://joshowens.me/environment-settings-and-security-with-meteor-js/
          const meteorSettings = _.extend({
            "public": { "site": site },
            "private": {},
            "log": { "level": "warn" }
          }, this.config.app.settings);

          // always update
          // meteorSettings['public']['site'] = site;
          meteorSettings['public']['version'] = deployment.brief();

          console.log("Updated Meteor Settings:");
          console.log(JSON.stringify(meteorSettings, null, "  "));

          siteConfig.env['METEOR_SETTINGS'] = JSON.stringify(meteorSettings);

          // An array of Promise<SummaryMap> for sites server
          const groupPromises : Array<Promise<SummaryMap>>
            = _.map(sessionsMap, (sessionGroup : SessionGroup) => {
                const taskBuilder = this.createTaskBuilderByOs(sessionGroup);
                const sessionPromises = _.map(sessionGroup.sessions,
                  (session : Session) => {
                    return new Promise<SummaryMap>(resolveTask => {
                      const env = _.extend({},
                                      this.config.env || {},
                                      siteConfig.env || {},
                                      session._serverConfig.env || {});
                      const taskList = taskBuilder.deploy(
                                    this.config,
                                    bundlePath,
                                    env,
                                    deployCheckWaitTime);
                      // propagate task events
                      this.propagateTaskEvents(taskList);
                        taskList.run(session, (summaryMap : SummaryMap) => {
                          resolveTask(summaryMap);
                        });
                    });
                  });
                return Promise.all(sessionPromises).then((summaryMaps) => {
                  return Promise.resolve(mergeSummaryMap(summaryMaps));
                });
              });
          return Promise.all(groupPromises).then((summaryMaps) => {
            return Promise.resolve(
              _.extend(previousSummaryMap, mergeSummaryMap(summaryMaps))
            );
          });
        });
      }
      return sitesPromise.then((summaryMap : SummaryMap) => {
        console.log(JSON.stringify(summaryMap, null, "  "));
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
