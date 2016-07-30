"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var underscore_1 = require("underscore");
var Plugin = (function () {
    function Plugin(config) {
        this.config = config;
    }
    return Plugin;
}());
exports.Plugin = Plugin;
var PluginRunner = (function () {
    function PluginRunner(config, cwd) {
        var _this = this;
        this.plugins = [];
        this.cwd = cwd;
        this.config = config;
        if (this.config.plugins instanceof Array) {
            underscore_1.default.each(this.config.plugins, function (pc) {
                // pc == plugin config or plugin instance
                _this.plugins.push(pc);
            });
        }
    }
    PluginRunner.prototype.whenSuccess = function (deployment) {
    };
    PluginRunner.prototype.whenFailure = function (deployment) {
    };
    PluginRunner.prototype.whenAfterCompleted = function (deployment) {
    };
    PluginRunner.prototype.whenAfterDeployed = function (deployment) {
    };
    return PluginRunner;
}());
exports.PluginRunner = PluginRunner;
var slack = require('node-slack');
/***
 *
 */
var SlackNotificationPlugin = (function (_super) {
    __extends(SlackNotificationPlugin, _super);
    function SlackNotificationPlugin(config) {
        _super.call(this, config);
        this.api = new slack(config.hookUrl, config.options);
    }
    // https://github.com/xoxco/node-slack
    SlackNotificationPlugin.prototype.send = function (msg) {
        this.api.send(msg);
    };
    return SlackNotificationPlugin;
}(Plugin));
exports.SlackNotificationPlugin = SlackNotificationPlugin;
//# sourceMappingURL=plugins.js.map