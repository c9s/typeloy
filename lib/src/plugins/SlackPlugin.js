"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Plugin_1 = require("../Plugin");
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
        var deferred = this.send({
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
            deferred.then(resolve, reject);
        });
    };
    SlackNotificationPlugin.prototype.whenFailure = function (deployment) {
        // Convert "deferred promise to ES6 Promise"
        var deferred = this.send({
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
            deferred.then(resolve, reject);
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
//# sourceMappingURL=SlackPlugin.js.map