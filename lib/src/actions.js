"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
var SummaryMap_1 = require("./SummaryMap");
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
var Actions = (function () {
    function Actions(config, cwd) {
        this.cwd = cwd;
        this.config = config;
        this.sessionManager = new SessionManager_1.SessionManager({
            "keepAlive": false
        });
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
    Actions.prototype.createSiteSessionsMap = function (config, siteName) {
        if (!siteName) {
            siteName = "default";
        }
        return this.sessionManager.createOsMap(config.sites[siteName].servers);
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
        var _this = this;
        var sessionsMap = this.createSiteSessionsMap(this.config, null);
        var sessionInfoList = _.values(sessionsMap);
        var promises = _.map(sessionInfoList, function (sessionsInfo) {
            return new Promise(function (resolve) {
                var taskListsBuilder = getTaskBuilderByOs(sessionsInfo.os);
                var taskList = taskListsBuilder[actionName].apply(taskListsBuilder, args);
                taskList.run(sessionsInfo.sessions, function (summaryMap) {
                    resolve(summaryMap);
                });
            });
        });
        return new Promise(function (resolveCompleted) {
            Promise.all(promises).then(function (mapResults) {
                _this.whenAfterCompleted(deployment, mapResults);
                resolveCompleted(mapResults);
            });
        });
    };
    Actions.prototype.reconfig = function (deployment) {
        var _this = this;
        var self = this;
        var sessionInfoList = [];
        var sessionsMap = this.createSiteSessionsMap(this.config, null);
        var _loop_1 = function(os_1) {
            var sessionsInfo = sessionsMap[os_1];
            sessionsInfo.sessions.forEach(function (session) {
                var env = _.extend({}, _this.config.env, session._serverConfig.env);
                var taskListsBuilder = getTaskBuilderByOs(sessionsInfo.os);
                var taskList = taskListsBuilder.reconfig(env, _this.config.appName);
                sessionInfoList.push({
                    'taskList': taskList,
                    'session': session
                });
            });
        };
        for (var os_1 in sessionsMap) {
            _loop_1(os_1);
        }
        var promises = _.map(sessionInfoList, function (sessionInfo) {
            return new Promise(function (resolve) {
                sessionInfo.taskList.run(sessionInfo.session, function (summaryMap) {
                    resolve(summaryMap);
                });
            });
        });
        return Promise.all(promises).then(function (mapResult) {
            _this.whenAfterCompleted(deployment, mapResult);
        });
    };
    Actions.prototype.restart = function (deployment) {
        return this._executePararell("restart", deployment, [this.config.appName]);
    };
    Actions.prototype.stop = function (deployment) {
        return this._executePararell("stop", deployment, [this.config.appName]);
    };
    ;
    Actions.prototype.start = function (deployment) {
        return this._executePararell("start", deployment, [this.config.appName]);
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
        return this.pluginRunner.whenBeforeBuilding(deployment);
    };
    Actions.prototype.whenBeforeDeploying = function (deployment) {
        return this.pluginRunner.whenBeforeDeploying(deployment);
    };
    /**
    * After completed ....
    *
    * Right now we don't have things to do, just exit the process with the error
    * code.
    */
    Actions.prototype.whenAfterCompleted = function (deployment, summaryMaps) {
        this.pluginRunner.whenAfterCompleted(deployment);
        var errorCode = SummaryMap_1.haveSummaryMapsErrors(summaryMaps) ? 1 : 0;
        var promises;
        if (errorCode != 0) {
            this.whenFailure(deployment, summaryMaps);
        }
        else {
            this.whenSuccess(deployment, summaryMaps);
        }
    };
    Actions.prototype.whenSuccess = function (deployment, summaryMaps) {
        return this.pluginRunner.whenSuccess(deployment);
    };
    Actions.prototype.whenFailure = function (deployment, summaryMaps) {
        return this.pluginRunner.whenFailure(deployment);
    };
    /**
     * Return a callback, which is used when after deployed, clean up the files.
     */
    Actions.prototype.whenAfterDeployed = function (deployment, summaryMaps) {
        return this.whenAfterCompleted(deployment, summaryMaps);
    };
    return Actions;
}());
exports.Actions = Actions;
var LogsAction = (function (_super) {
    __extends(LogsAction, _super);
    function LogsAction() {
        _super.apply(this, arguments);
    }
    LogsAction.prototype.run = function (options) {
        var self = this;
        var tailOptions = [];
        if (options.tail) {
            tailOptions.push('-f');
        }
        function tailCommand(os, config, tailOptions) {
            if (os == 'linux') {
                return 'sudo tail ' + tailOptions.join(' ') + ' /var/log/upstart/' + config.appName + '.log';
            }
            else if (os == 'sunos') {
                return 'sudo tail ' + tailOptions.join(' ') +
                    ' /var/svc/log/site-' + config.appName + '\\:default.log';
            }
            else {
                throw new Error("Unsupported OS.");
            }
        }
        var sessionsMap = this.createSiteSessionsMap(this.config, null);
        var _loop_2 = function(os_2) {
            var sessionsInfo = sessionsMap[os_2];
            sessionsInfo.sessions.forEach(function (session) {
                var hostPrefix = '[' + session._host + '] ';
                var command = tailCommand(os_2, this.config, tailOptions);
                session.execute(command, {
                    "onStdout": function (data) {
                        process.stdout.write(hostPrefix + data.toString());
                    },
                    "onStderr": function (data) {
                        process.stderr.write(hostPrefix + data.toString());
                    }
                });
            });
        };
        for (var os_2 in sessionsMap) {
            _loop_2(os_2);
        }
    };
    return LogsAction;
}(Actions));
exports.LogsAction = LogsAction;
var SetupAction = (function (_super) {
    __extends(SetupAction, _super);
    function SetupAction() {
        _super.apply(this, arguments);
    }
    SetupAction.prototype.run = function (deployment) {
        this._showKadiraLink();
        return this._executePararell("setup", deployment, [this.config]);
    };
    return SetupAction;
}(Actions));
exports.SetupAction = SetupAction;
var DeployAction = (function (_super) {
    __extends(DeployAction, _super);
    function DeployAction() {
        _super.apply(this, arguments);
    }
    DeployAction.prototype.run = function (deployment, sites, options) {
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
        // Handle build
        var afterBuild = new Promise(function (resolveBuild, rejectBuild) {
            build_1.buildApp(appPath, meteorBinary, buildLocation, bundlePath, function () {
                _this.whenBeforeBuilding(deployment);
            }, function (err) {
                if (err) {
                    rejectBuild(err);
                }
                resolveBuild();
            });
        });
        var afterDeploy = new Promise(function (resolveDeploy, rejectDeploy) {
            afterBuild.catch(function (reason) {
                console.error("rejectDeploy", reason);
                rejectDeploy(reason);
            });
            afterBuild.then(function () {
                // We only want to fire once for now.
                _this.whenBeforeDeploying(deployment);
                var sessionsMap = _this.createSiteSessionsMap(_this.config, null);
                // An array of Promise<SummaryMap>
                var pendingTasks = _.map(sessionsMap, function (sessionsInfo) {
                    return new Promise(function (resolveTask, rejectTask) {
                        var taskBuilder = getTaskBuilderByOs(sessionsInfo.os);
                        var sessions = sessionsInfo.sessions;
                        var env = _.extend({}, _this.config.env);
                        var taskList = taskBuilder.deploy(_this.config, bundlePath, env, deployCheckWaitTime, appName);
                        taskList.run(sessions, function (summaryMap) {
                            resolveTask(summaryMap);
                        });
                    });
                });
                // whenAfterDeployed
                Promise.all(pendingTasks).then(function (results) {
                    console.log("Array<SummaryMap>", results);
                    _this.pluginRunner.whenAfterDeployed(deployment);
                    if (options.clean) {
                        console.log("Cleaning up " + buildLocation);
                        rimraf.sync(buildLocation);
                    }
                    resolveDeploy(results);
                }).catch(function (reason) {
                    rejectDeploy(reason);
                    console.error("Failed", reason);
                });
            });
        });
        return afterDeploy;
    };
    return DeployAction;
}(Actions));
exports.DeployAction = DeployAction;
//# sourceMappingURL=Actions.js.map