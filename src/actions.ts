import path = require('path');
import fs = require('fs');
var rimraf = require('rimraf');
import {spawn, exec} from 'child_process';
var uuid = require('uuid');
var format = require('util').format;
var extend = require('util')._extend;
var async = require('async');

import {Config, AppConfig, ServerConfig} from './config';
import LinuxTaskBuilder from "./TaskBuilder/LinuxTaskBuilder";
import SunOSTaskBuilder from "./TaskBuilder/SunOSTaskBuilder";
import {TaskBuilder} from "./TaskBuilder/BaseTaskBuilder";
import Deployment from './Deployment';
import {CmdDeployOptions} from './options';
import {SessionManager, SessionManagerConfig, SessionsInfo, SessionsMap, SummaryMapResult, SummaryMap, ExecutedResult} from './SessionManager';

import {Plugin} from "./Plugin";
import {PluginRunner} from "./PluginRunner";
import {SlackNotificationPlugin} from './PluginRunner';

import _ = require('underscore');
import {buildApp} from './build';

var os = require('os');
require('colors');




interface LogOptions {
  tail?: boolean;
}

/**
 * Return the task builder by operating system name.
 */
function getTaskBuilderByOs(os:string) : TaskBuilder {
  switch (os) {
    case "linux":
      return new LinuxTaskBuilder;
    case "sunos":
      return new SunOSTaskBuilder;
    default:
      throw new Error("Unsupported operating system.");
  }
}



/*
Session {
  _host: '...',
  _auth: { username: 'root', password: '...' },
  _options:
   { ssh: { agent: '....' },
     keepAlive: true },
  _keepAlive: true,
  _tasks: [],
  _callbacks: [],
  _debug: { [Function: disabled] enabled: false },
  _serverConfig:
   { host: '....',
     username: 'root',
     password: '...',
     env:
      { ROOT_URL: 'http://site.com',
        CLUSTER_ENDPOINT_URL: 'http://111.222.11.22:80' },
     sshOptions: { agent: '/tmp/ssh-RcgKVIGk8tfL/agent.4345' },
     os: 'linux' } }
*/
interface Session {
  /**
   * copy data from src to dest
   */
  copy(src, dest, options, callback)

  /**
   * execute shell command on remote server
   */
  execute(shellCommand, options, callback)

  /**
   * execute script on remote server
   */
  executeScript(scriptFile, options, callback)

  /**
   * close the connection.
   */
  close()
}


const kadiraRegex = /^meteorhacks:kadira/m;




function haveSummaryMapsErrors(summaryMaps) {
  return _.some(summaryMaps, hasSummaryMapErrors);
}

function hasSummaryMapErrors(summaryMap) {
  return _.some(summaryMap, (summary:any) => {
    return summary.error;
  });
}




export class Actions {

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
    let setttingsJsonPath = path.resolve(this.cwd, 'settings.json');
    if (fs.existsSync(setttingsJsonPath)) {
      this.config.env['METEOR_SETTINGS'] = JSON.stringify(require(setttingsJsonPath));
    }
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
  protected createSiteSessionsMap(config : Config, siteName : string) : SessionsMap {

    if (!siteName) {
      siteName = "default";
    }
    return this.sessionManager.createOsMap(config.sites[siteName].servers);
  }

  protected _showKadiraLink() {
    var versionsFile = path.join((<AppConfig>this.config.app).directory, '.meteor/versions');
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

  protected _executePararell(actionName:string, deployment : Deployment, args) : Promise<ExecutedResult> {
    let sessionsMap = this.createSiteSessionsMap(this.config, null);
    let sessionInfoList = _.values(sessionsMap);
    let promises = _.map(sessionInfoList,
      (sessionsInfo:SessionsInfo) => {
        return new Promise<ExecutedResult>(resolve => {
          // let taskList = getTaskBuilderByO(sessionsInfo.os);
          let taskList = sessionsInfo.taskListsBuilder[actionName].apply(sessionsInfo.taskListsBuilder, args);
          taskList.run(sessionsInfo.sessions, (summaryMap:SummaryMapResult) => {
            resolve({ deployment: deployment,
                      error: null,
                      summary: summaryMap } as ExecutedResult);
          });
        });
      });
    return new Promise<ExecutedResult>(resolveCompleted => {
      Promise.all(promises).then((mapResult : Array<ExecutedResult>) => {
        let res = mapResult[0];
        this.whenAfterCompleted(res.deployment, res.error, res.summary);
        resolveCompleted(res);
      });
    });
  }

  public setup(deployment : Deployment) : Promise<any> {
    this._showKadiraLink();
    return this._executePararell("setup", deployment, [this.config]);
  }

  public reconfig(deployment: Deployment) {
    var self = this;
    let sessionInfoList = [];
    let sessionsMap = this.createSiteSessionsMap(this.config, null);
    for (let os in sessionsMap) {
      let sessionsInfo : SessionsInfo = sessionsMap[os];
      sessionsInfo.sessions.forEach( (session) => {
        var env = _.extend({}, this.config.env, session._serverConfig.env);
        var taskList = sessionsInfo.taskListsBuilder.reconfig(env, this.config.appName);
        sessionInfoList.push({
          'taskList': taskList,
          'session': session
        });
      });
    }
    let promises = _.map(sessionInfoList, (sessionInfo) => {
      return new Promise<ExecutedResult>(resolve => {
        sessionInfo.taskList.run(sessionInfo.session, (summaryMap : SummaryMap) => {
          resolve({ deployment: deployment, error: null, summary: summaryMap } as ExecutedResult);
        });
      });
    });
    return Promise.all(promises).then((mapResult : Array<ExecutedResult>) => {
      let res = mapResult[0];
      this.whenAfterCompleted(res.deployment, res.error, res.summary);
    });
  }

  public restart(deployment : Deployment) {
    return this._executePararell("restart", deployment, [this.config.appName]);
  }

  public stop(deployment : Deployment) {
    return this._executePararell("stop", deployment, [this.config.appName]);
  };

  public start(deployment : Deployment) {
    return this._executePararell("start", deployment, [this.config.appName]);
  }

  public logs(options:LogOptions) {
    var self = this;
    var tailOptions = [];
    if (options.tail) {
      tailOptions.push('-f');
    }

    function tailCommand(os : string, config : Config, tailOptions) {
      if (os == 'linux') {
        return 'sudo tail ' + tailOptions.join(' ') + ' /var/log/upstart/' + config.appName + '.log';
      } else if (os == 'sunos') {
        return 'sudo tail ' + tailOptions.join(' ') +
          ' /var/svc/log/site-' + config.appName + '\\:default.log';
      } else {
        throw new Error("Unsupported OS.");
      }
    }

    let sessionsMap = this.createSiteSessionsMap(this.config, null);
    for (let os in sessionsMap) {
      let sessionsInfo : SessionsInfo = sessionsMap[os];
      sessionsInfo.sessions.forEach(function(session) {
        let hostPrefix = '[' + session._host + '] ';
        let command = tailCommand(os, this.config, tailOptions);
        session.execute(command, {
          onStdout: (data) => {
            process.stdout.write(hostPrefix + data.toString());
          },
          onStderr: (data) => {
            process.stderr.write(hostPrefix + data.toString());
          }
        });
      });
    }
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

  protected whenBeforeBuilding(deployment : Deployment) {
    return this.pluginRunner.whenBeforeBuilding(deployment);
  }

  protected whenBeforeDeploying(deployment : Deployment) {
    return this.pluginRunner.whenBeforeDeploying(deployment);
  }

  /**
  * After completed ....
  *
  * Right now we don't have things to do, just exit the process with the error
  * code.
  */
  protected whenAfterCompleted(deployment : Deployment, error, summaryMaps) {
    this.pluginRunner.whenAfterCompleted(deployment);
    var errorCode = error || haveSummaryMapsErrors(summaryMaps) ? 1 : 0;
    let promises;
    if (errorCode != 0) {
      this.whenFailure(deployment, error, summaryMaps);
    } else {
      this.whenSuccess(deployment, error, summaryMaps);
    }
  }

  public whenSuccess(deployment : Deployment, error, summaryMaps) {
    return this.pluginRunner.whenSuccess(deployment);
  }

  public whenFailure(deployment : Deployment, error, summaryMaps) {
    return this.pluginRunner.whenFailure(deployment);
  }

  /**
   * Return a callback, which is used when after deployed, clean up the files.
   */
  whenAfterDeployed(deployment : Deployment, error, summaryMaps) {
    return this.whenAfterCompleted(deployment, error, summaryMaps);
  }
}




export class DeployAction extends Actions {
  public run(deployment : Deployment, sites:Array<string>, options:CmdDeployOptions) {
    this._showKadiraLink();
    const getDefaultBuildDirName = function(appName:string, tag:string) : string {
      return (appName || "meteor-") + "-" + (tag || uuid.v4());
    };

    const buildLocation = process.env.METEOR_BUILD_DIR || path.resolve(os.tmpdir(), getDefaultBuildDirName(this.config.appName, deployment.tag));
    const bundlePath = options.bundleFile || path.resolve(buildLocation, 'bundle.tar.gz');

    console.log('Deployment Tag:', deployment.tag);
    console.log('Build Location:', buildLocation);
    console.log('Bundle Path:', bundlePath);

    // spawn inherits env vars from process.env
    // so we can simply set them like this
    process.env.BUILD_LOCATION = buildLocation;

    var deployCheckWaitTime = this.config.deploy.checkDelay;

    var appConfig = this.config.app;
    var appName = appConfig.name;
    var appPath = appConfig.directory;
    var meteorBinary = this.config.meteor.binary;

    console.log('Meteor Path: ' + meteorBinary);
    console.log('Building Started: ' + this.config.app.name);

    // Handle build
    let afterBuild = new Promise( (resolveBuild, rejectBuild) => {
      buildApp(appPath, meteorBinary, buildLocation, bundlePath, () => {
        this.whenBeforeBuilding(deployment);
      }, (err:Error) => {
        if (err) {
          rejectBuild(err);
        }
        resolveBuild();
      });
    });

    let afterDeploy = new Promise( (resolveDeploy, rejectDeploy) => {

      afterBuild.catch( (reason) => {
        console.error("rejectDeploy", reason);
        rejectDeploy(reason);
      });

      afterBuild.then(() => {

        // We only want to fire once for now.
        this.whenBeforeDeploying(deployment);
        
        let sessionsMap = this.createSiteSessionsMap(this.config, null);
        // An array of Promise<ExecutedResult>
        let pendingTasks : Array<Promise<ExecutedResult>>
          = _.map(sessionsMap, (sessionsInfo : SessionsInfo) => {
            return new Promise<ExecutedResult>( (resolveTask, rejectTask) => {
              let taskBuilder = getTaskBuilderByOs(sessionsInfo.os);
              let sessions = sessionsInfo.sessions;

              let env = _.extend({}, this.config.env);
              let taskList = taskBuilder.deploy(
                              this.config,
                              bundlePath,
                              env,
                              deployCheckWaitTime, appName);
              taskList.run(sessions, (summaryMap : SummaryMap) => {
                resolveTask({ deployment: deployment, error: null, summary: summaryMap } as ExecutedResult);
              });
            });
        });

        // whenAfterDeployed
        Promise.all(pendingTasks).then( (results : Array<ExecutedResult>) => {
          console.log("Array<ExecutedResult>", results);
          let res = results[0];
          let error = res.error;
          let summaryMaps = res.summary;
          /*
          this.pluginRunner.whenAfterDeployed(deployment);
          if (options.clean) {
            console.log(`Cleaning up ${buildLocation}`);
            rimraf.sync(buildLocation);
          }
          this.whenAfterDeployed(deployment, buildLocation, options);
          */
          resolveDeploy(res);
        }).catch( (reason) => {
          rejectDeploy(reason);
          console.error("Failed", reason);
        });
      });
    });
    return afterDeploy;
  }
}
