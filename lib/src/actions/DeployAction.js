"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BaseAction_1 = require('./BaseAction');
var build_1 = require('../build');
var uuid = require('uuid');
var format = require('util').format;
var extend = require('util')._extend;
var path = require('path');
var fs = require('fs');
var os = require('os');
var rimraf = require('rimraf');
var _ = require('underscore');
var DeployAction = (function (_super) {
    __extends(DeployAction, _super);
    function DeployAction() {
        _super.apply(this, arguments);
    }
    DeployAction.prototype.run = function (deployment, site, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var appConfig = this.config.app;
        var appName = appConfig.name;
        var siteConfig = this.getSiteConfig(site);
        this._showKadiraLink();
        var getDefaultBuildDirName = function (appName, tag) {
            return (appName || "meteor") + "-" + (tag || uuid.v4());
        };
        var buildLocation = process.env.METEOR_BUILD_DIR || path.resolve(os.tmpdir(), getDefaultBuildDirName(appName, deployment.tag));
        var bundlePath = options.bundleFile || path.resolve(buildLocation, 'bundle.tar.gz');
        console.log('Deployment Tag:', deployment.tag);
        console.log('Build Location:', buildLocation);
        console.log('Bundle Path:', bundlePath);
        // spawn inherits env vars from process.env
        // so we can simply set them like this
        process.env.BUILD_LOCATION = buildLocation;
        var deployCheckWaitTime = this.config.deploy.checkDelay;
        var builder = new build_1.MeteorBuilder(this.config);
        return builder.buildApp(appConfig.directory, buildLocation, bundlePath, function () {
            _this.whenBeforeBuilding(deployment);
        }).then(function () {
            console.log("Connecting to the servers...");
            // We only want to fire once for now.
            _this.whenBeforeDeploying(deployment);
            var sessionsMap = _this.createSiteSessionsMap(siteConfig);
            // An array of Promise<SummaryMap>
            var pendingTasks = _.map(sessionsMap, function (sessionGroup) {
                return new Promise(function (resolveTask, rejectTask) {
                    var taskBuilder = _this.getTaskBuilderByOs(sessionGroup.os);
                    var sessions = sessionGroup.sessions;
                    // XXX: expend env from site and config it self.
                    var env = _.extend({}, _this.config.env);
                    var taskList = taskBuilder.deploy(_this.config, bundlePath, env, deployCheckWaitTime, appName);
                    taskList.run(sessions, function (summaryMap) {
                        resolveTask(summaryMap);
                    });
                });
            });
            return Promise.all(pendingTasks).then(function (results) {
                _this.pluginRunner.whenAfterDeployed(deployment);
                if (options.clean) {
                    console.log("Cleaning up " + buildLocation);
                    rimraf.sync(buildLocation);
                }
                return Promise.resolve(results);
            }).catch(function (reason) {
                console.error("Failed", reason);
                return Promise.reject(reason);
            });
        });
    };
    DeployAction.prototype.whenBeforeBuilding = function (deployment) {
        return this.pluginRunner.whenBeforeBuilding(deployment);
    };
    DeployAction.prototype.whenBeforeDeploying = function (deployment) {
        return this.pluginRunner.whenBeforeDeploying(deployment);
    };
    /**
     * Return a callback, which is used when after deployed, clean up the files.
     */
    DeployAction.prototype.whenAfterDeployed = function (deployment, summaryMaps) {
        return this.whenAfterCompleted(deployment, summaryMaps);
    };
    return DeployAction;
}(BaseAction_1.BaseAction));
exports.DeployAction = DeployAction;
//# sourceMappingURL=DeployAction.js.map