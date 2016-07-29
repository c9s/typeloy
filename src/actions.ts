var nodemiral = require('nodemiral');
import path = require('path');
import fs = require('fs');
var rimraf = require('rimraf');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var uuid = require('uuid');
var format = require('util').format;
var extend = require('util')._extend;
var async = require('async');

import LinuxTasks from "./taskLists/linux";
import SunosTasks from "./taskLists/sunos";
import {CmdDeployOptions} from './options';

import _ = require('underscore');
import {buildApp} from './build';

var os = require('os');
require('colors');

const kadiraRegex = /^meteorhacks:kadira/m;

function storeLastNChars(vars, field, limit, color) {
  return function(data) {
    vars[field] += data.toString();
    if(vars[field].length > 1000) {
      vars[field] = vars[field].substring(vars[field].length - 1000);
    }
  };
}

function whenAfterDeployed(buildLocation, options:CmdDeployOptions) {
  return (error, summaryMaps) => {
    if (!options.noClean) {
      console.log(`Cleaning up ${buildLocation}`);
      rimraf.sync(buildLocation);
    }
    whenAfterCompleted(error, summaryMaps);
  };
}

function whenAfterCompleted(error, summaryMaps) {
  var errorCode = error || haveSummaryMapsErrors(summaryMaps) ? 1 : 0;
  process.exit(errorCode);
}

function haveSummaryMapsErrors(summaryMaps) {
  return _.some(summaryMaps, hasSummaryMapErrors);
}

function hasSummaryMapErrors(summaryMap) {
  return _.some(summaryMap, (summary:any) => {
    return summary.error;
  });
}

export default class Actions {
  public cwd;
  public config;
  public sessionsMap;

  constructor(config, cwd) {
    this.cwd = cwd;
    this.config = config;
    this.sessionsMap = this._createSessionsMap(config);

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
  * @param {object} config (the mup config object)
  */
  private _createSessionsMap(config) {
    var sessionsMap = {};

    config.servers.forEach(function(server) {
      var host = server.host;
      var auth:any = { username: server.username };

      if(server.pem) {
        auth.pem = fs.readFileSync(path.resolve(server.pem), 'utf8');
      } else {
        auth.password = server.password;
      }

      var nodemiralOptions = {
        ssh: server.sshOptions,
        keepAlive: true
      };

      if(!sessionsMap[server.os]) {
        switch (server.os) {
          case "linux":
            sessionsMap[server.os] = {
              sessions: [],
              taskListsBuilder: LinuxTasks
            };
            break;
          case "sunos":
            sessionsMap[server.os] = {
              sessions: [],
              taskListsBuilder: SunosTasks
            };
            break;
        }


      }

      var session = nodemiral.session(host, auth, nodemiralOptions);
      session._serverConfig = server;
      sessionsMap[server.os].sessions.push(session);
    });

    return sessionsMap;
  }

  private _showKadiraLink() {
    var versionsFile = path.join(this.config.app, '.meteor/versions');
    if (fs.existsSync(versionsFile)) {
      var packages = fs.readFileSync(versionsFile, 'utf-8');
      var hasKadira = kadiraRegex.test(packages);
      if(!hasKadira) {
        console.log(
          "“ Checkout " + "Kadira".bold + "!"+
          "\n  It's the best way to monitor performance of your app."+
          "\n  Visit: " + "https://kadira.io/mup".underline + " ”\n"
        );
      }
    }
  }

  private _executePararell(actionName:string, args) {
    var self = this;
    var sessionInfoList = _.values(self.sessionsMap);
    async.map(
      sessionInfoList,
      function(sessionsInfo, callback) {
        var taskList = sessionsInfo.taskListsBuilder[actionName]
          .apply(sessionsInfo.taskListsBuilder, args);
        taskList.run(sessionsInfo.sessions, function(summaryMap) {
          callback(null, summaryMap);
        });
      },
      whenAfterCompleted
    );
  }

  public setup() {
    this._showKadiraLink();
    this._executePararell("setup", [this.config]);
  }

  public deploy(version:string, sites:Array<string>, options:CmdDeployOptions) {
    var self = this;
    self._showKadiraLink();

    const getDefaultBuildDirName = function(appName:string = null, version:string = null) : string {
      return (appName || "meteor-") + "-" + (version || uuid.v4());
    };

    const buildLocation = process.env.BUILD_DIR || path.resolve(os.tmpdir(), getDefaultBuildDirName(this.config.appName, version));
    const bundlePath = path.resolve(buildLocation, 'bundle.tar.gz');

    console.log('Version:', version);
    console.log('Bundle Path:', bundlePath);

    // spawn inherits env vars from process.env
    // so we can simply set them like this
    process.env.BUILD_LOCATION = buildLocation;

    var deployCheckWaitTime = this.config.deployCheckWaitTime;
    var appName = this.config.appName;
    var appPath = this.config.app;
    var enableUploadProgressBar = this.config.enableUploadProgressBar;
    var meteorBinary = this.config.meteorBinary;

    console.log('Meteor Path: ' + meteorBinary);
    console.log('Building Started: ' + this.config.app);
    buildApp(appPath, meteorBinary, buildLocation, function(err) {
      if (err) {
        process.exit(1);
        return;
      }
      var sessionsData = [];
      _.forEach(self.sessionsMap, (sessionsInfo:any) => {
        var taskListsBuilder = sessionsInfo.taskListsBuilder;
        _.forEach(sessionsInfo.sessions, function (session) {
          sessionsData.push({
            taskListsBuilder: taskListsBuilder,
            session: session
          });
        });
      });

      async.mapSeries(
        sessionsData,
        (sessionData, callback) => {
          var session = sessionData.session;
          var taskListsBuilder = sessionData.taskListsBuilder;
          var env = _.extend({}, self.config.env, session._serverConfig.env);
          var taskList = taskListsBuilder.deploy(
            bundlePath, env,
            deployCheckWaitTime, appName, enableUploadProgressBar);
          taskList.run(session, function (summaryMap) {
            callback(null, summaryMap);
          });
        },
        whenAfterDeployed(buildLocation, options)
      );
    });
  }

  public reconfig() {
    var self = this;
    var sessionInfoList = [];
    for (var os in self.sessionsMap) {
      var sessionsInfo = self.sessionsMap[os];
      sessionsInfo.sessions.forEach(function(session) {
        var env = _.extend({}, self.config.env, session._serverConfig.env);
        var taskList = sessionsInfo.taskListsBuilder.reconfig(
          env, self.config.appName);
        sessionInfoList.push({
          taskList: taskList,
          session: session
        });
      });
    }

    async.mapSeries(
      sessionInfoList,
      function(sessionInfo, callback) {
        sessionInfo.taskList.run(sessionInfo.session, function(summaryMap) {
          callback(null, summaryMap);
        });
      },
      whenAfterCompleted
    );
  }

  public restart() {
    this._executePararell("restart", [this.config.appName]);
  }

  public stop() {
    this._executePararell("stop", [this.config.appName]);
  };

  public start() {
    this._executePararell("start", [this.config.appName]);
  }

  public logs(options) {
    var self = this;
    var tailOptions = options.tail || '';

    for(var os in self.sessionsMap) {
      var sessionsInfo = self.sessionsMap[os];
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

        if(os == 'linux') {
          var command = 'sudo tail ' + tailOptions + ' /var/log/upstart/' + self.config.appName + '.log';
        } else if(os == 'sunos') {
          var command = 'sudo tail ' + tailOptions +
            ' /var/svc/log/site-' + self.config.appName + '\\:default.log';
        }
        session.execute(command, opts);
      });
    }
  }

  public init() {
    var destMupJson = path.resolve('mup.json');
    var destSettingsJson = path.resolve('settings.json');

    if(fs.existsSync(destMupJson) || fs.existsSync(destSettingsJson)) {
      console.error('A Project Already Exists'.bold.red);
      process.exit(1);
    }

    var exampleMupJson = path.resolve(__dirname, '../example/mup.json');
    var exampleSettingsJson = path.resolve(__dirname, '../example/settings.json');

    copyFile(exampleMupJson, destMupJson);
    copyFile(exampleSettingsJson, destSettingsJson);

    console.log('Empty Project Initialized!'.bold.green);

    function copyFile(src, dest) {
      var content = fs.readFileSync(src, 'utf8');
      fs.writeFileSync(dest, content);
    }
  }
}

