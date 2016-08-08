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
import {SessionManager, SessionsInfo} from './SessionManager';

import {Plugin} from "./Plugin";
import {PluginRunner} from "./PluginRunner";
import {SlackNotificationPlugin} from './PluginRunner';

import _ = require('underscore');
import {buildApp} from './build';

var os = require('os');
require('colors');


interface SessionsMap {
  [os:string]: SessionsInfo;
}


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


/*
 // For later refactoring
export class DeployAction {
  protected deployment : Deployment;

  constructor(deployment : Deployment) {
    this.deployment = deployment;
  }

  public run(sites : Array<string>, options:CmdDeployOptions) {

  }
}
*/


export default class Actions {

  public cwd:string;

  public config:Config;

  public sessionsMap : SessionsMap;

  protected pluginRunner:PluginRunner;

  constructor(config:Config, cwd:string) {
    this.cwd = cwd;
    this.config = config;
    this.sessionsMap = this._createSiteSessionsMap(config, null);

    this.pluginRunner = new PluginRunner(config, cwd);

    // Get settings.json into env,
    // The METEOR_SETTINGS can be used for setting up meteor application without passing "--settings=...."
    //
    // Here is the guide of using METEOR_SETTINGS
    // https://themeteorchef.com/snippets/making-use-of-settings-json/#tmc-using-settingsjson
    //
    // @see http://joshowens.me/environment-settings-and-security-with-meteor-js/
    var setttingsJsonPath = path.resolve(this.cwd, 'settings.json');
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
  private _createSiteSessionsMap(config:Config, siteName:string) : SessionsMap {
    let sessionsMap : SessionsMap = {} as SessionsMap;

    if (!siteName) {
      siteName = "_default_";
    }
    config.sites[siteName].servers.forEach((server:ServerConfig) => {
      let session = SessionManager.create(server);

      // Create os => taskListBuilder map
      if (!sessionsMap[server.os]) {
        switch (server.os) {
          case "linux":
            sessionsMap[server.os] = {
              os: server.os,
              sessions: [],
              taskListsBuilder: getTaskBuilderByOs(server.os)
            } as SessionsInfo;
            break;
          case "sunos":
            sessionsMap[server.os] = {
              os: server.os,
              sessions: [],
              taskListsBuilder: getTaskBuilderByOs(server.os)
            } as SessionsInfo;
            break;
        }
      }
      sessionsMap[server.os].sessions.push(session);
    });

    return sessionsMap;
  }

  private _showKadiraLink() {
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

  private _executePararell(actionName:string, deployment : Deployment, args) {
    var sessionInfoList = _.values(this.sessionsMap);
    async.map(
      sessionInfoList,
      // callback: the trigger method
      (sessionsInfo:SessionsInfo, callback) => {
        let taskList = sessionsInfo.taskListsBuilder[actionName]
          .apply(sessionsInfo.taskListsBuilder, args);
        taskList.run(sessionsInfo.sessions, function(summaryMap) {
          callback(deployment, null, summaryMap);
        });
      },
      this.whenAfterCompleted
    );
  }

  public setup(deployment : Deployment) {
    this._showKadiraLink();
    this._executePararell("setup", deployment, [this.config]);
  }

  public deploy(deployment : Deployment, sites:Array<string>, options:CmdDeployOptions) {
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

    buildApp(appPath, meteorBinary, buildLocation, bundlePath, () => {
      this.whenBeforeBuilding(deployment);
    } , (err:Error) => {
      if (err) {
        throw err;
      }
      var sessionsData = [];
      _.forEach(this.sessionsMap, (sessionsInfo:SessionsInfo) => {
        var taskListsBuilder = sessionsInfo.taskListsBuilder;
        _.forEach(sessionsInfo.sessions, (session) => {
          sessionsData.push({
            taskListsBuilder: taskListsBuilder,
            session: session
          });
        });
      });

      // We only want to fire once for now.
      this.whenBeforeDeploying(deployment);

      async.mapSeries(
        sessionsData,
        (sessionData, callback) => {
          console.log('sessionData', sessionData);

          let session = sessionData.session;
          let taskListsBuilder = sessionData.taskListsBuilder;
          let env = _.extend({}, this.config.env, session._serverConfig.env);

          // Build deploy tasks
          let taskList = taskListsBuilder.deploy(
                          this.config,
                          bundlePath,
                          env,
                          deployCheckWaitTime, appName);
          taskList.run(session, (summaryMap) => {
            callback(null, summaryMap);
          });
        },
        // When all deployment was done, this method will be triggered.
        this.whenAfterDeployed(deployment, buildLocation, options)
      );
    });
  }

  public reconfig(deployment: Deployment) {
    var self = this;
    var sessionInfoList = [];
    for (var os in this.sessionsMap) {
      let sessionsInfo : SessionsInfo = this.sessionsMap[os];
      sessionsInfo.sessions.forEach((session) => {
        var env = _.extend({}, this.config.env, session._serverConfig.env);
        var taskList = sessionsInfo.taskListsBuilder.reconfig(env, this.config.appName);
        sessionInfoList.push({
          taskList: taskList,
          session: session
        });
      });
    }
    async.mapSeries(
      sessionInfoList,
      (sessionInfo, callback) => {
        sessionInfo.taskList.run(sessionInfo.session, (summaryMap) => {
          console.log(summaryMap);
          callback(deployment, null, summaryMap);
        });
      },
      this.whenAfterCompleted
    );
  }

  public restart(deployment : Deployment) {
    this._executePararell("restart", deployment, [this.config.appName]);
  }

  public stop(deployment : Deployment) {
    this._executePararell("stop", deployment, [this.config.appName]);
  };

  public start(deployment : Deployment) {
    this._executePararell("start", deployment, [this.config.appName]);
  }

  public logs(options:LogOptions) {
    var self = this;
    var tailOptions = [];
    if (options.tail) {
      tailOptions.push('-f');
    }
    for (var os in this.sessionsMap) {
      var sessionsInfo : SessionsInfo = this.sessionsMap[os];
      sessionsInfo.sessions.forEach(function(session) {
        var hostPrefix = '[' + session._host + '] ';
        var opts = {
          onStdout: function(data) {
            process.stdout.write(hostPrefix + data.toString());
          },
          onStderr: function(data) {
            process.stderr.write(hostPrefix + data.toString());
          }
        };

        if (os == 'linux') {
          var command = 'sudo tail ' + tailOptions.join(' ') + ' /var/log/upstart/' + self.config.appName + '.log';
        } else if(os == 'sunos') {
          var command = 'sudo tail ' + tailOptions.join(' ') +
            ' /var/svc/log/site-' + self.config.appName + '\\:default.log';
        }
        session.execute(command, opts);
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

    var exampleJson = path.resolve(__dirname, '../example/typeloy.json');
    var exampleSettingsJson = path.resolve(__dirname, '../example/settings.json');

    copyFile(exampleJson, destConfigJson);
    copyFile(exampleSettingsJson, destSettingsJson);
    console.log('New Project Initialized!');
    function copyFile(src, dest) {
      var content = fs.readFileSync(src, 'utf8');
      fs.writeFileSync(dest, content);
    }
  }

  whenBeforeBuilding(deployment : Deployment) {
    this.pluginRunner.whenBeforeBuilding(deployment);
  }

  whenBeforeDeploying(deployment : Deployment) {
    this.pluginRunner.whenBeforeDeploying(deployment);
  }

  /**
  * After completed ....
  *
  * Right now we don't have things to do, just exit the process with the error
  * code.
  */
  whenAfterCompleted(deployment : Deployment, error, summaryMaps) {
    this.pluginRunner.whenAfterCompleted(deployment);
    var errorCode = error || haveSummaryMapsErrors(summaryMaps) ? 1 : 0;
    let promises;
    if (errorCode != 0) {
      promises = this.whenFailure(deployment, error, summaryMaps);
    } else {
      promises = this.whenSuccess(deployment, error, summaryMaps);
    }
    Promise.all(promises).then(() => {
      // XXX:
      process.exit(errorCode);
    });
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
  whenAfterDeployed(deployment : Deployment, buildLocation:string, options:CmdDeployOptions) {
    return (error, summaryMaps) => {
      this.pluginRunner.whenAfterDeployed(deployment);
      if (options.clean) {
        console.log(`Cleaning up ${buildLocation}`);
        rimraf.sync(buildLocation);
      }
      return this.whenAfterCompleted(deployment, error, summaryMaps);
    };
  }
}

