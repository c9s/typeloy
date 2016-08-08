"use strict";
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var uuid = require('uuid');
var format = require('util').format;
var extend = require('util')._extend;
var async = require('async');
var LinuxTaskBuilder_1 = require("./TaskBuilder/LinuxTaskBuilder");
var SunOSTaskBuilder_1 = require("./TaskBuilder/SunOSTaskBuilder");
var SessionManager_1 = require('./SessionManager');
var PluginRunner_1 = require("./PluginRunner");
var _ = require('underscore');
var build_1 = require('./build');
var os = require('os');
require('colors');
/**
 * Return the task builder by operating system name.
 */
function getTaskBuilderByOs(os) {
    switch (os) {
        case "linux":
            return new LinuxTaskBuilder_1.default;
        case "sunos":
            return new SunOSTaskBuilder_1.default;
        default:
            throw new Error("Unsupported operating system.");
    }
}
var kadiraRegex = /^meteorhacks:kadira/m;
function haveSummaryMapsErrors(summaryMaps) {
    return _.some(summaryMaps, hasSummaryMapErrors);
}
function hasSummaryMapErrors(summaryMap) {
    return _.some(summaryMap, function (summary) {
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
var Actions = (function () {
    function Actions(config, cwd) {
        this.cwd = cwd;
        this.config = config;
        this.sessionsMap = this._createSiteSessionsMap(config, null);
        this.pluginRunner = new PluginRunner_1.PluginRunner(config, cwd);
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
    Actions.prototype._createSiteSessionsMap = function (config, siteName) {
        var sessionsMap = {};
        if (!siteName) {
            siteName = "default";
        }
        config.sites[siteName].servers.forEach(function (server) {
            var session = SessionManager_1.SessionManager.create(server);
            // Create os => taskListBuilder map
            if (!sessionsMap[server.os]) {
                switch (server.os) {
                    case "linux":
                        sessionsMap[server.os] = {
                            os: server.os,
                            sessions: [],
                            taskListsBuilder: getTaskBuilderByOs(server.os)
                        };
                        break;
                    case "sunos":
                        sessionsMap[server.os] = {
                            os: server.os,
                            sessions: [],
                            taskListsBuilder: getTaskBuilderByOs(server.os)
                        };
                        break;
                }
            }
            sessionsMap[server.os].sessions.push(session);
        });
        return sessionsMap;
    };
    Actions.prototype._showKadiraLink = function () {
        var versionsFile = path.join(this.config.app.directory, '.meteor/versions');
        if (fs.existsSync(versionsFile)) {
            var packages = fs.readFileSync(versionsFile, 'utf-8');
            var hasKadira = kadiraRegex.test(packages);
            if (!hasKadira) {
                console.log("“ Checkout " + "Kadira" + "!" +
                    "\n  It's the best way to monitor performance of your app." +
                    "\n  Visit: " + "https://kadira.io/mup" + " ”\n");
            }
        }
    };
    Actions.prototype._executePararell = function (actionName, deployment, args) {
        var sessionInfoList = _.values(this.sessionsMap);
        async.map(sessionInfoList, 
        // callback: the trigger method
        function (sessionsInfo, callback) {
            var taskList = sessionsInfo.taskListsBuilder[actionName]
                .apply(sessionsInfo.taskListsBuilder, args);
            taskList.run(sessionsInfo.sessions, function (summaryMap) {
                callback(deployment, null, summaryMap);
            });
        }, this.whenAfterCompleted);
    };
    Actions.prototype.setup = function (deployment) {
        this._showKadiraLink();
        this._executePararell("setup", deployment, [this.config]);
    };
    Actions.prototype.deploy = function (deployment, sites, options) {
        var _this = this;
        this._showKadiraLink();
        var getDefaultBuildDirName = function (appName, tag) {
            return (appName || "meteor-") + "-" + (tag || uuid.v4());
        };
        var buildLocation = process.env.METEOR_BUILD_DIR || path.resolve(os.tmpdir(), getDefaultBuildDirName(this.config.appName, deployment.tag));
        var bundlePath = options.bundleFile || path.resolve(buildLocation, 'bundle.tar.gz');
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
        build_1.buildApp(appPath, meteorBinary, buildLocation, bundlePath, function () {
            _this.whenBeforeBuilding(deployment);
        }, function (err) {
            if (err) {
                throw err;
            }
            var sessionsData = [];
            _.forEach(_this.sessionsMap, function (sessionsInfo) {
                var taskListsBuilder = sessionsInfo.taskListsBuilder;
                _.forEach(sessionsInfo.sessions, function (session) {
                    sessionsData.push({
                        taskListsBuilder: taskListsBuilder,
                        session: session
                    });
                });
            });
            // We only want to fire once for now.
            _this.whenBeforeDeploying(deployment);
            async.mapSeries(sessionsData, function (sessionData, callback) {
                console.log('sessionData', sessionData);
                var session = sessionData.session;
                var taskListsBuilder = sessionData.taskListsBuilder;
                var env = _.extend({}, _this.config.env, session._serverConfig.env);
                // Build deploy tasks
                var taskList = taskListsBuilder.deploy(_this.config, bundlePath, env, deployCheckWaitTime, appName);
                taskList.run(session, function (summaryMap) {
                    callback(null, summaryMap);
                });
            }, 
            // When all deployment was done, this method will be triggered.
            _this.whenAfterDeployed(deployment, buildLocation, options));
        });
    };
    Actions.prototype.reconfig = function (deployment) {
        var _this = this;
        var self = this;
        var sessionInfoList = [];
        var _loop_1 = function() {
            var sessionsInfo = this_1.sessionsMap[os];
            sessionsInfo.sessions.forEach(function (session) {
                var env = _.extend({}, _this.config.env, session._serverConfig.env);
                var taskList = sessionsInfo.taskListsBuilder.reconfig(env, _this.config.appName);
                sessionInfoList.push({
                    taskList: taskList,
                    session: session
                });
            });
        };
        var this_1 = this;
        for (var os in this.sessionsMap) {
            _loop_1();
        }
        async.mapSeries(sessionInfoList, function (sessionInfo, callback) {
            sessionInfo.taskList.run(sessionInfo.session, function (summaryMap) {
                console.log(summaryMap);
                callback(deployment, null, summaryMap);
            });
        }, this.whenAfterCompleted);
    };
    Actions.prototype.restart = function (deployment) {
        this._executePararell("restart", deployment, [this.config.appName]);
    };
    Actions.prototype.stop = function (deployment) {
        this._executePararell("stop", deployment, [this.config.appName]);
    };
    ;
    Actions.prototype.start = function (deployment) {
        this._executePararell("start", deployment, [this.config.appName]);
    };
    Actions.prototype.logs = function (options) {
        var self = this;
        var tailOptions = [];
        if (options.tail) {
            tailOptions.push('-f');
        }
        for (var os in this.sessionsMap) {
            var sessionsInfo = this.sessionsMap[os];
            sessionsInfo.sessions.forEach(function (session) {
                var hostPrefix = '[' + session._host + '] ';
                var opts = {
                    onStdout: function (data) {
                        process.stdout.write(hostPrefix + data.toString());
                    },
                    onStderr: function (data) {
                        process.stderr.write(hostPrefix + data.toString());
                    }
                };
                if (os == 'linux') {
                    var command = 'sudo tail ' + tailOptions.join(' ') + ' /var/log/upstart/' + self.config.appName + '.log';
                }
                else if (os == 'sunos') {
                    var command = 'sudo tail ' + tailOptions.join(' ') +
                        ' /var/svc/log/site-' + self.config.appName + '\\:default.log';
                }
                session.execute(command, opts);
            });
        }
    };
    /**
     * Initalize a project from example files.
     */
    Actions.prototype.init = function () {
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
    };
    Actions.prototype.whenBeforeBuilding = function (deployment) {
        this.pluginRunner.whenBeforeBuilding(deployment);
    };
    Actions.prototype.whenBeforeDeploying = function (deployment) {
        this.pluginRunner.whenBeforeDeploying(deployment);
    };
    /**
    * After completed ....
    *
    * Right now we don't have things to do, just exit the process with the error
    * code.
    */
    Actions.prototype.whenAfterCompleted = function (deployment, error, summaryMaps) {
        this.pluginRunner.whenAfterCompleted(deployment);
        var errorCode = error || haveSummaryMapsErrors(summaryMaps) ? 1 : 0;
        var promises;
        if (errorCode != 0) {
            promises = this.whenFailure(deployment, error, summaryMaps);
        }
        else {
            promises = this.whenSuccess(deployment, error, summaryMaps);
        }
        Promise.all(promises).then(function () {
            // XXX:
            process.exit(errorCode);
        });
    };
    Actions.prototype.whenSuccess = function (deployment, error, summaryMaps) {
        return this.pluginRunner.whenSuccess(deployment);
    };
    Actions.prototype.whenFailure = function (deployment, error, summaryMaps) {
        return this.pluginRunner.whenFailure(deployment);
    };
    /**
     * Return a callback, which is used when after deployed, clean up the files.
     */
    Actions.prototype.whenAfterDeployed = function (deployment, buildLocation, options) {
        var _this = this;
        return function (error, summaryMaps) {
            _this.pluginRunner.whenAfterDeployed(deployment);
            if (options.clean) {
                console.log("Cleaning up " + buildLocation);
                rimraf.sync(buildLocation);
            }
            return _this.whenAfterCompleted(deployment, error, summaryMaps);
        };
    };
    return Actions;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Actions;
//# sourceMappingURL=actions.js.map