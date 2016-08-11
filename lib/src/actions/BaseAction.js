"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var path = require('path');
var fs = require('fs');
var LinuxTaskBuilder_1 = require("../TaskBuilder/LinuxTaskBuilder");
var SunOSTaskBuilder_1 = require("../TaskBuilder/SunOSTaskBuilder");
var SessionManager_1 = require('../SessionManager');
var SummaryMap_1 = require("../SummaryMap");
var PluginRunner_1 = require("../PluginRunner");
var events_1 = require("events");
var _ = require('underscore');
var propagate = require('propagate');
var os = require('os');
require('colors');
var kadiraRegex = /^meteorhacks:kadira/m;
function copyFile(src, dest) {
    var content = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dest, content);
}
var BaseAction = (function (_super) {
    __extends(BaseAction, _super);
    function BaseAction(config) {
        _super.call(this);
        this.config = config;
        this.sessionManager = new SessionManager_1.SessionManager({
            "keepAlive": false
        });
        this.pluginRunner = new PluginRunner_1.PluginRunner(config);
        // Get settings.json into env,
        // The METEOR_SETTINGS can be used for setting up meteor application without passing "--settings=...."
        //
        // Here is the guide of using METEOR_SETTINGS
        // https://themeteorchef.com/snippets/making-use-of-settings-json/#tmc-using-settingsjson
        //
        // @see http://joshowens.me/environment-settings-and-security-with-meteor-js/
        var settings = this.loadSettings();
        if (settings) {
            this.config.env['METEOR_SETTINGS'] = JSON.stringify(settings);
        }
    }
    BaseAction.prototype.loadSettings = function () {
        if (typeof this.config.app.settings === "object") {
            return this.config.app.settings;
        }
        var settingsFilename = this.config.app.settings || 'settings.json';
        if (typeof settingsFilename === "string") {
            var dir = void 0;
            var settingsFile = void 0;
            if (dir = this.config.dirname) {
                settingsFile = path.resolve(dir, settingsFilename);
                if (fs.existsSync(settingsFile)) {
                    console.log("Found " + settingsFile);
                    return require(settingsFile);
                }
            }
            if (dir = this.config.app.directory) {
                settingsFile = path.resolve(dir, settingsFilename);
                if (fs.existsSync(settingsFile)) {
                    console.log("Found " + settingsFile);
                    return require(settingsFile);
                }
            }
            if (dir = this.config.app.root) {
                settingsFile = path.resolve(dir, settingsFilename);
                if (fs.existsSync(settingsFile)) {
                    console.log("Found " + settingsFile);
                    return require(settingsFile);
                }
            }
            if (fs.existsSync(settingsFilename)) {
                console.log("Found " + settingsFilename);
                return require(settingsFilename);
            }
        }
        console.error("settings.json not found.");
        return {};
    };
    /**
    * Return the task builder by operating system name.
    */
    BaseAction.prototype.getTaskBuilderByOs = function (os) {
        switch (os) {
            case "linux":
                return new LinuxTaskBuilder_1.default;
            case "sunos":
                return new SunOSTaskBuilder_1.default;
            default:
                throw new Error("Unsupported operating system.");
        }
    };
    BaseAction.prototype.getSiteConfig = function (siteName) {
        var site = this.config.sites[siteName];
        if (!site) {
            throw new Error(siteName + " is not found in the sites.");
        }
        return site;
    };
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
    BaseAction.prototype.createSiteSessionsMap = function (site) {
        var servers = site.servers;
        if (servers.length === 0) {
            throw new Error("Emtpy server list.");
        }
        return this.sessionManager.createOsMap(servers);
    };
    // XXX: Extract this to Kadira plugin
    BaseAction.prototype._showKadiraLink = function () {
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
    BaseAction.prototype.executePararell = function (actionName, deployment, site, args) {
        var _this = this;
        var siteConfig = this.getSiteConfig(site);
        var sessionsMap = this.createSiteSessionsMap(siteConfig);
        var sessionInfoList = _.values(sessionsMap);
        var promises = _.map(sessionInfoList, function (sessionGroup) {
            return new Promise(function (resolve) {
                var taskListsBuilder = _this.getTaskBuilderByOs(sessionGroup.os);
                var taskList = taskListsBuilder[actionName].apply(taskListsBuilder, args);
                // propagate events to this
                propagate(taskList, _this);
                taskList.run(sessionGroup.sessions, function (summaryMap) {
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
    /**
     * Initalize a project from example files.
     */
    BaseAction.prototype.init = function () {
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
    };
    /**
    * After completed ....
    *
    * Right now we don't have things to do, just exit the process with the error
    * code.
    */
    BaseAction.prototype.whenAfterCompleted = function (deployment, summaryMaps) {
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
    BaseAction.prototype.whenSuccess = function (deployment, summaryMaps) {
        return this.pluginRunner.whenSuccess(deployment);
    };
    BaseAction.prototype.whenFailure = function (deployment, summaryMaps) {
        return this.pluginRunner.whenFailure(deployment);
    };
    BaseAction.prototype.error = function (a) {
        var message = a;
        var err = null;
        if (a instanceof Error) {
            err = a;
            message = a.message;
        }
        this.emit('error', message, err);
        console.error(message, err);
    };
    BaseAction.prototype.debug = function (a) {
        var message = a;
        if (typeof a === "object") {
            message = JSON.stringify(a, null, "  ");
        }
        this.emit('debug', message);
        console.log(message);
    };
    BaseAction.prototype.progress = function (message) {
        this.emit('progress', message);
        console.log(message);
    };
    BaseAction.prototype.log = function (message) {
        this.emit('log', message);
        console.log(message);
    };
    return BaseAction;
}(events_1.EventEmitter));
exports.BaseAction = BaseAction;
//# sourceMappingURL=BaseAction.js.map