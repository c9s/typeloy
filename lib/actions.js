"use strict";
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
const linux_1 = require("./taskLists/linux");
const sunos_1 = require("./taskLists/sunos");
const plugins_1 = require('./plugins');
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
        this.sessionsMap = this._createSessionsMap(config);
        this.pluginRunner = new plugins_1.PluginRunner(config, cwd);
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
    _createSessionsMap(config) {
        var sessionsMap = {};
        config.servers.forEach(function (server) {
            var host = server.host;
            var auth = { username: server.username };
            if (server.pem) {
                auth.pem = fs.readFileSync(path.resolve(server.pem), 'utf8');
            }
            else {
                auth.password = server.password;
            }
            var nodemiralOptions = {
                ssh: server.sshOptions,
                keepAlive: true
            };
            if (!sessionsMap[server.os]) {
                switch (server.os) {
                    case "linux":
                        sessionsMap[server.os] = {
                            sessions: [],
                            taskListsBuilder: linux_1.default
                        };
                        break;
                    case "sunos":
                        sessionsMap[server.os] = {
                            sessions: [],
                            taskListsBuilder: sunos_1.default
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
    _executePararell(actionName, args) {
        var self = this;
        var sessionInfoList = _.values(self.sessionsMap);
        async.map(sessionInfoList, function (sessionsInfo, callback) {
            var taskList = sessionsInfo.taskListsBuilder[actionName]
                .apply(sessionsInfo.taskListsBuilder, args);
            taskList.run(sessionsInfo.sessions, function (summaryMap) {
                callback(null, summaryMap);
            });
        }, this.whenAfterCompleted);
    }
    setup() {
        this._showKadiraLink();
        this._executePararell("setup", [this.config]);
    }
    deploy(deploymen, sites, options) {
        var self = this;
        self._showKadiraLink();
        const getDefaultBuildDirName = function (appName, tag) {
            return (appName || "meteor-") + "-" + (tag || uuid.v4());
        };
        const buildLocation = process.env.METEOR_BUILD_DIR || path.resolve(os.tmpdir(), getDefaultBuildDirName(this.config.appName, deploymen.tag));
        const bundlePath = options.bundleFile || path.resolve(buildLocation, 'bundle.tar.gz');
        console.log('Deployment Tag:', deploymen.tag);
        console.log('Build Location:', buildLocation);
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
        build_1.buildApp(appPath, meteorBinary, buildLocation, bundlePath, (err) => {
            if (err) {
                process.exit(1);
                return;
            }
            var sessionsData = [];
            _.forEach(self.sessionsMap, (sessionsInfo) => {
                var taskListsBuilder = sessionsInfo.taskListsBuilder;
                _.forEach(sessionsInfo.sessions, function (session) {
                    sessionsData.push({
                        taskListsBuilder: taskListsBuilder,
                        session: session
                    });
                });
            });
            async.mapSeries(sessionsData, (sessionData, callback) => {
                var session = sessionData.session;
                var taskListsBuilder = sessionData.taskListsBuilder;
                var env = _.extend({}, self.config.env, session._serverConfig.env);
                var taskList = taskListsBuilder.deploy(bundlePath, env, deployCheckWaitTime, appName, enableUploadProgressBar);
                taskList.run(session, function (summaryMap) {
                    callback(null, summaryMap);
                });
            }, this.whenAfterDeployed(buildLocation, options));
        });
    }
    reconfig() {
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
                callback(null, summaryMap);
            });
        }, this.whenAfterCompleted);
    }
    restart() {
        this._executePararell("restart", [this.config.appName]);
    }
    stop() {
        this._executePararell("stop", [this.config.appName]);
    }
    ;
    start() {
        this._executePararell("start", [this.config.appName]);
    }
    logs(options) {
        var self = this;
        var tailOptions = options.tail || '';
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
                    var command = 'sudo tail ' + tailOptions + ' /var/log/upstart/' + self.config.appName + '.log';
                }
                else if (os == 'sunos') {
                    var command = 'sudo tail ' + tailOptions +
                        ' /var/svc/log/site-' + self.config.appName + '\\:default.log';
                }
                session.execute(command, opts);
            });
        }
    }
    init() {
        var destMupJson = path.resolve('mup.json');
        var destSettingsJson = path.resolve('settings.json');
        if (fs.existsSync(destMupJson) || fs.existsSync(destSettingsJson)) {
            console.error('A Project Already Exists');
            process.exit(1);
        }
        var exampleMupJson = path.resolve(__dirname, '../example/mup.json');
        var exampleSettingsJson = path.resolve(__dirname, '../example/settings.json');
        copyFile(exampleMupJson, destMupJson);
        copyFile(exampleSettingsJson, destSettingsJson);
        console.log('Empty Project Initialized!');
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
    whenAfterCompleted(error, summaryMaps) {
        var errorCode = error || haveSummaryMapsErrors(summaryMaps) ? 1 : 0;
        if (errorCode != 0) {
            this.whenFailure(error, summaryMaps);
        }
        else {
            this.whenSuccess(error, summaryMaps);
        }
        process.exit(errorCode);
    }
    whenSuccess(error, summaryMaps) {
    }
    whenFailure(error, summaryMaps) {
    }
    /**
     * Return a callback, which is used when after deployed, clean up the files.
     */
    whenAfterDeployed(buildLocation, options) {
        return (error, summaryMaps) => {
            if (options.clean) {
                console.log(`Cleaning up ${buildLocation}`);
                rimraf.sync(buildLocation);
            }
            this.whenAfterCompleted(error, summaryMaps);
        };
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Actions;
//# sourceMappingURL=actions.js.map