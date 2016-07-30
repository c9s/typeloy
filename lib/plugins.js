"use strict";
const underscore_1 = require("underscore");
class Plugin {
    constructor(config) {
        this.config = config;
    }
}
exports.Plugin = Plugin;
class PluginRunner {
    constructor(config, cwd) {
        this.plugins = [];
        this.cwd = cwd;
        this.config = config;
        if (this.config.plugins instanceof Array) {
            underscore_1.default.each(this.config.plugins, (pc) => {
                // pc == plugin config or plugin instance
                this.plugins.push(pc);
            });
        }
    }
    whenSuccess(deployment) {
    }
    whenFailure(deployment) {
    }
    whenAfterCompleted(deployment) {
    }
    whenAfterDeployed(deployment) {
    }
}
exports.PluginRunner = PluginRunner;
var slack = require('node-slack');
/***
 *
 */
class SlackNotificationPlugin extends Plugin {
    constructor(config) {
        super(config);
        this.api = new slack(config.hookUrl, config.options);
    }
    // https://github.com/xoxco/node-slack
    send(msg) {
        this.api.send(msg);
    }
}
exports.SlackNotificationPlugin = SlackNotificationPlugin;
//# sourceMappingURL=plugins.js.map