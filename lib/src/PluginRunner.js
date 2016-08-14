"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
__export(require("./plugins/SlackPlugin"));
var _ = require('underscore');
var PluginRunner = (function () {
    function PluginRunner(config) {
        var _this = this;
        this.plugins = [];
        this.config = config;
        this.plugins = [];
        if (this.config.plugins && this.config.plugins instanceof Array) {
            _.each(this.config.plugins, function (pc) {
                // pc == plugin config or plugin instance
                _this.plugins.push(pc);
            });
        }
    }
    PluginRunner.prototype.whenBeforeBuilding = function (deployment) {
        _.each(this.plugins, function (p) { p.whenBeforeBuilding(deployment); });
    };
    PluginRunner.prototype.whenBeforeDeploying = function (deployment) {
        _.each(this.plugins, function (p) { p.whenBeforeDeploying(deployment); });
    };
    PluginRunner.prototype.whenSuccess = function (deployment) {
        console.log("whenSuccess");
        var promises = _.compact(_.map(this.plugins, function (p) { return p.whenSuccess(deployment); }));
        if (promises.length == 0) {
            return;
        }
        return Promise.all(promises);
    };
    PluginRunner.prototype.whenFailure = function (deployment) {
        console.log("whenFailure");
        var promises = _.compact(_.map(this.plugins, function (p) { return p.whenFailure(deployment); }));
        if (promises.length == 0) {
            return;
        }
        return Promise.all(promises);
    };
    PluginRunner.prototype.whenAfterCompleted = function (deployment) {
        _.each(this.plugins, function (p) { p.whenAfterCompleted(deployment); });
    };
    PluginRunner.prototype.whenAfterDeployed = function (deployment) {
        _.each(this.plugins, function (p) { p.whenAfterDeployed(deployment); });
    };
    return PluginRunner;
}());
exports.PluginRunner = PluginRunner;
//# sourceMappingURL=PluginRunner.js.map