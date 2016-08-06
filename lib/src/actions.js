"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var nodemiral = require('nodemiral');
const path = require('path');
const fs = require('fs');
var rimraf = require('rimraf');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var uuid = require('uuid');
var format = require('util').format;
var extend = require('util')._extend;
var async = require('async');
const LinuxTaskBuilder_1 = require("./TaskBuilder/LinuxTaskBuilder");
const SunOSTaskBuilder_1 = require("./TaskBuilder/SunOSTaskBuilder");
const PluginRunner_1 = require("./PluginRunner");
const _ = require('underscore');
const build_1 = require('./build');
var os = require('os');
require('colors');
const kadiraRegex = /^meteorhacks:kadira/m;
function storeLastNChars(vars, field, limit, color) {
    return function (data) {
        vars[field] += data.toString();
        if (vars[field].length > 1000) {
            vars[field] = vars[field].substring(vars[field].length - 1000);
        }
    };
}
function haveSummaryMapsErrors(summaryMaps) {
    return _.some(summaryMaps, hasSummaryMapErrors);
}
function hasSummaryMapErrors(summaryMap) {
    return _.some(summaryMap, (summary) => {
        return summary.error;
    });
}
class Actions {
    constructor(config, cwd) {
        this.cwd = cwd;
        this.config = config;
        this.sessionsMap = this._createSessionsMap(config, null);
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
    _createSessionsMap(config, siteName) {
        var sessionsMap = {};
        if (!siteName) {
            siteName = "_default_";
        }
        config.sites[siteName].servers.forEach((server) => {
            var host = server.host;
            /// The auth object is used for nodemiral to connect ssh servers.
            var auth = {
                username: server.username
            };
            if (server.pem) {
                auth.pem = fs.readFileSync(path.resolve(server.pem), 'utf8');
            }
            else {
                auth.password = server.password;
            }
            // create options for nodemiral
            var nodemiralOptions = {
                ssh: server.sshOptions,
                keepAlive: true
            };
            // Create os => taskListBuilder map
            if (!sessionsMap[server.os]) {
                switch (server.os) {
                    case "linux":
                        sessionsMap[server.os] = {
                            sessions: [],
                            taskListsBuilder: LinuxTaskBuilder_1.default
                        };
                        break;
                    case "sunos":
                        sessionsMap[server.os] = {
                            sessions: [],
                            taskListsBuilder: SunOSTaskBuilder_1.default
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
    _showKadiraLink() {
        var versionsFile = path.join(this.config.app, '.meteor/versions');
        if (fs.existsSync(versionsFile)) {
            var packages = fs.readFileSync(versionsFile, 'utf-8');
            var hasKadira = kadiraRegex.test(packages);
            if (!hasKadira) {
                console.log("“ Checkout " + "Kadira" + "!" +
                    "\n  It's the best way to monitor performance of your app." +
                    "\n  Visit: " + "https://kadira.io/mup" + " ”\n");
            }
        }
    }
    _executePararell(actionName, deployment, args) {
        var self = this;
        var sessionInfoList = _.values(self.sessionsMap);
        async.map(sessionInfoList, 
        // callback: the trigger method
            (sessionsInfo, callback) => {
            var taskList = sessionsInfo.taskListsBuilder[actionName]
                .apply(sessionsInfo.taskListsBuilder, args);
            taskList.run(sessionsInfo.sessions, function (summaryMap) {
                callback(deployment, null, summaryMap);
            });
        }, this.whenAfterCompleted);
    }
    setup(deployment) {
        this._showKadiraLink();
        this._executePararell("setup", deployment, [this.config]);
    }
    deploy(deployment, sites, options) {
        var self = this;
        self._showKadiraLink();
        const getDefaultBuildDirName = function (appName, tag) {
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
        var meteorBinary = this.config.meteorBinary;
        console.log('Meteor Path: ' + meteorBinary);
        console.log('Building Started: ' + this.config.app);
        build_1.buildApp(appPath, meteorBinary, buildLocation, bundlePath, () => {
            this.whenBeforeBuilding(deployment);
        }, (err) => {
            if (err) {
                throw err;
            }
            var sessionsData = [];
            _.forEach(self.sessionsMap, (sessionsInfo) => {
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
            async.mapSeries(sessionsData, (sessionData, callback) => {
                var session = sessionData.session;
                var taskListsBuilder = sessionData.taskListsBuilder;
                var env = _.extend({}, this.config.env, session._serverConfig.env);
                // Build deploy tasks
                var taskList = taskListsBuilder.deploy(this.config, bundlePath, env, deployCheckWaitTime, appName);
                taskList.run(session, (summaryMap) => {
                    callback(null, summaryMap);
                });
            }, 
            // When all deployment was done, this method will be triggered.
            this.whenAfterDeployed(deployment, buildLocation, options));
        });
    }
    reconfig(deployment) {
        var self = this;
        var sessionInfoList = [];
        for (var os in this.sessionsMap) {
            var sessionsInfo = this.sessionsMap[os];
            sessionsInfo.sessions.forEach((session) => {
                var env = _.extend({}, this.config.env, session._serverConfig.env);
                var taskList = sessionsInfo.taskListsBuilder.reconfig(env, this.config.appName);
                sessionInfoList.push({
                    taskList: taskList,
                    session: session
                });
            });
        }
        async.mapSeries(sessionInfoList, (sessionInfo, callback) => {
            sessionInfo.taskList.run(sessionInfo.session, function (summaryMap) {
                callback(deployment, null, summaryMap);
            });
        }, this.whenAfterCompleted);
    }
    restart(deployment) {
        this._executePararell("restart", deployment, [this.config.appName]);
    }
    stop(deployment) {
        this._executePararell("stop", deployment, [this.config.appName]);
    }
    ;
    start(deployment) {
        this._executePararell("start", deployment, [this.config.appName]);
    }
    logs(options) {
        var self = this;
        var tailOptions = [];
        if (options.tail) {
            tailOptions.push('-f');
        }
        for (var os in self.sessionsMap) {
            var sessionsInfo = self.sessionsMap[os];
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
    }
    /**
     * Initalize a project from example files.
     */
    init() {
        var destConfigJson = path.resolve('typeloy.json');
        var destSettingsJson = path.resolve('settings.json');
        if (fs.existsSync(destConfigJson) || fs.existsSync(destSettingsJson)) {
            console.error('A Project Already Exists');
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
    whenBeforeBuilding(deployment) {
        this.pluginRunner.whenBeforeBuilding(deployment);
    }
    whenBeforeDeploying(deployment) {
        this.pluginRunner.whenBeforeDeploying(deployment);
    }
    /**
    * After completed ....
    *
    * Right now we don't have things to do, just exit the process with the error
    * code.
    */
    whenAfterCompleted(deployment, error, summaryMaps) {
        return __awaiter(this, void 0, void 0, function* () {
            this.pluginRunner.whenAfterCompleted(deployment);
            var errorCode = error || haveSummaryMapsErrors(summaryMaps) ? 1 : 0;
            if (errorCode != 0) {
                yield this.whenFailure(deployment, error, summaryMaps);
            }
            else {
                yield this.whenSuccess(deployment, error, summaryMaps);
            }
            process.exit(errorCode);
        });
    }
    whenSuccess(deployment, error, summaryMaps) {
        return __awaiter(this, void 0, void 0, function* () {
            let promise = this.pluginRunner.whenSuccess(deployment);
            yield promise;
        });
    }
    whenFailure(deployment, error, summaryMaps) {
        return __awaiter(this, void 0, void 0, function* () {
            let promise = this.pluginRunner.whenFailure(deployment);
            yield promise;
        });
    }
    /**
     * Return a callback, which is used when after deployed, clean up the files.
     */
    whenAfterDeployed(deployment, buildLocation, options) {
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Actions;
//# sourceMappingURL=actions.js.map