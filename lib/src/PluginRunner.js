"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Plugin_1 = require("./Plugin");
var _ = require('underscore');
var PluginRunner = (function () {
    function PluginRunner(config, cwd) {
        var _this = this;
        this.plugins = [];
        this.cwd = cwd;
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
        var promises = _.map(this.plugins, function (p) {
            return p.whenSuccess(deployment);
        }).compact();
        if (promises.length == 0) {
            return;
        }
        return Promise.all(promises);
    };
    PluginRunner.prototype.whenFailure = function (deployment) {
        console.log("whenFailure");
        var promises = _.map(this.plugins, function (p) {
            return p.whenFailure(deployment);
        }).compact();
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
var slack = require('node-slack');
var SlackNotificationPlugin = (function (_super) {
    __extends(SlackNotificationPlugin, _super);
    function SlackNotificationPlugin(config) {
        _super.call(this);
        this.config = config;
        // https://github.com/xoxco/node-slack
        this.api = new slack(config.hookUrl, config.options || {});
    }
    SlackNotificationPlugin.prototype.whenBeforeBuilding = function (deployment) {
        this.send({
            "text": "Started building " + deployment.config.appName + " ....",
            "attachments": [
                this.createGitCommitAttachment(deployment.revInfo, {
                    "color": "#cccccc",
                    "pretext": "The deployment was created.",
                    "image_url": "http://cache.lovethispic.com/uploaded_images/thumbs/195529-First-Day-Of-Deployment-Vs-The-Last-Month.jpg",
                })
            ]
        });
    };
    SlackNotificationPlugin.prototype.whenBeforeDeploying = function (deployment) {
        this.send({
            "text": "Started deploying " + deployment.config.appName + "...",
            "attachments": [
                this.createGitCommitAttachment(deployment.revInfo, {
                    "color": "#999999",
                    "pretext": "The deployment is now started.",
                    "image_url": "https://media.giphy.com/media/tXLpxypfSXvUc/giphy.gif",
                })
            ]
        });
    };
    SlackNotificationPlugin.prototype.whenSuccess = function (deployment) {
        // Convert "deferred promise to ES6 Promise"
        var promise = this.send({
            "text": "Succeed!!!",
            "attachments": [
                this.createGitCommitAttachment(deployment.revInfo, {
                    "color": "#39aa56",
                    "pretext": deployment.config.appName + " is successfully deployed.",
                    "image_url": "http://66.media.tumblr.com/tumblr_ltb3i7VfUf1qblmtj.gif",
                })
            ]
        });
        return new Promise(function (resolve, reject) {
            promise.then(resolve, reject);
        });
    };
    SlackNotificationPlugin.prototype.whenFailure = function (deployment) {
        // Convert "deferred promise to ES6 Promise"
        var promise = this.send({
            "text": "Failed............................",
            "attachments": [
                this.createGitCommitAttachment(deployment.revInfo, {
                    "color": "#db4545",
                    "pretext": "The deployment of " + deployment.config.appName + " was failed.",
                    "image_url": "https://media.giphy.com/media/a9xhxAxaqOfQs/giphy.gif",
                })
            ]
        });
        return new Promise(function (resolve, reject) {
            promise.then(resolve, reject);
        });
    };
    SlackNotificationPlugin.prototype.linkCommitHref = function (hash) {
        if (this.config.github) {
            return "<https://github.com/" + this.config.github.org + "/" + this.config.github.repo + "/commit/" + hash + "|" + hash + ">";
        }
        return hash;
    };
    SlackNotificationPlugin.prototype.createGitCommitAttachment = function (revInfo, extra) {
        var latestCommit = revInfo.latestCommit();
        var attachment = {
            "fallback": "The attachement isn't supported.",
            "title": "Commit Message",
            "author_name": process.env['USER'],
            "text": latestCommit.message,
            "fields": [{
                    "title": "Commit",
                    "value": this.linkCommitHref(revInfo.latestCommit().hash),
                    "short": true
                }, {
                    "title": "Author",
                    "value": latestCommit.author.name,
                    "short": true
                }, {
                    "title": "Date",
                    "value": latestCommit.date,
                    "short": true
                }, {
                    "title": "Latest Tag",
                    "value": revInfo.latestTag,
                    "short": true,
                }],
            "mrkdwn_in": ["text", "fields"],
        };
        return _.extend(attachment, extra || {});
    };
    /**
     * @return {deferred.promise}
     */
    SlackNotificationPlugin.prototype.send = function (msg) {
        return this.api.send(_.extend({
            "channel": this.config.channel,
            "username": this.config.username
        }, msg));
    };
    return SlackNotificationPlugin;
}(Plugin_1.Plugin));
exports.SlackNotificationPlugin = SlackNotificationPlugin;
//# sourceMappingURL=PluginRunner.js.map