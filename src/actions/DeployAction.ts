import {BaseAction} from './BaseAction';
import {Config} from '../config';
import {Deployment} from '../Deployment';
import {Session} from '../Session';
import {SessionManager, SessionManagerConfig, SessionGroup, SessionsMap} from '../SessionManager';
import {SummaryMap,SummaryMapResult, SummaryMapHistory, haveSummaryMapsErrors, hasSummaryMapErrors} from "../SummaryMap";
import {CmdDeployOptions} from '../options';
import {MeteorBuilder} from '../build';

var uuid = require('uuid');
var format = require('util').format;
var extend = require('util')._extend;
var path = require('path');
var fs = require('fs');
var os = require('os');
var rimraf = require('rimraf');
var _ = require('underscore');

export class DeployAction extends BaseAction {

  public run(deployment : Deployment, site : string, options : CmdDeployOptions = {} as CmdDeployOptions) {

    const appConfig = this.config.app;
    const appName = appConfig.name;
    const siteConfig = this.getSiteConfig(site);

    this._showKadiraLink();

    const getDefaultBuildDirName = function(appName : string, tag : string) : string {
      return (appName || "meteor") + "-" + (tag || uuid.v4());
    };

    const buildLocation = options.buildDir 
                          || process.env.METEOR_BUILD_DIR 
                          || path.resolve(os.tmpdir(), getDefaultBuildDirName(appName, deployment.tag));
    const bundlePath = options.bundleFile || path.resolve(buildLocation, 'bundle.tar.gz');

    console.log('Deployment Tag:', deployment.tag);
    console.log('Build Location:', buildLocation);
    console.log('Bundle Path:', bundlePath);

    // spawn inherits env vars from process.env
    // so we can simply set them like this
    process.env.BUILD_LOCATION = buildLocation;

    var deployCheckWaitTime = this.config.deploy.checkDelay;


    const builder = new MeteorBuilder(this.config);

    return builder.buildApp(appConfig.directory, buildLocation, bundlePath, () => {
      this.whenBeforeBuilding(deployment);
    }).then(() => {
      console.log("Connecting to the servers...");
      // We only want to fire once for now.
      this.whenBeforeDeploying(deployment);

      const sessionsMap = this.createSiteSessionsMap(siteConfig);

      // An array of Promise<SummaryMap>
      const pendingTasks : Array<Promise<SummaryMap>>
        = _.map(sessionsMap, (sessionGroup : SessionGroup) => {
          return new Promise<SummaryMap>( (resolveTask, rejectTask) => {
            let taskBuilder = this.getTaskBuilderByOs(sessionGroup.os);
            const sessions = sessionGroup.sessions;

            const hasCustomEnv = _.some(sessions, (session : Session) => session._serverConfig.env );


            const env = _.extend({}, this.config.env || {}, siteConfig.env || {});
            const taskList = taskBuilder.deploy(
                            this.config,
                            bundlePath,
                            env,
                            deployCheckWaitTime, appName);
            taskList.run(sessions, (summaryMap : SummaryMap) => {
              resolveTask(summaryMap);
            });
          });
      });
      return Promise.all(pendingTasks).then((results : Array<SummaryMap>) => {
        this.pluginRunner.whenAfterDeployed(deployment);
        if (options.clean) {
          console.log(`Cleaning up ${buildLocation}`);
          rimraf.sync(buildLocation);
        }
        return Promise.resolve(results);
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
  public whenAfterDeployed(deployment : Deployment, summaryMaps : Array<SummaryMap>) {
    return this.whenAfterCompleted(deployment, summaryMaps);
  }
}
