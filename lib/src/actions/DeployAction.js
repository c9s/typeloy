"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var actions_1 = require('../actions');
var build_1 = require('../build');
var uuid = require('uuid');
var format = require('util').format;
var extend = require('util')._extend;
var path = require('path');
var fs = require('fs');
var os = require('os');
var rimraf = require('rimraf');
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
                        var taskBuilder = actions_1.getTaskBuilderByOs(sessionsInfo.os);
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
}(actions_1.Actions));
exports.DeployAction = DeployAction;
//# sourceMappingURL=DeployAction.js.map