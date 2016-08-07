"use strict";
const _ = require('underscore');
const Plugin_1 = require("./Plugin");
class PluginRunner {
    constructor(config, cwd) {
        this.plugins = [];
        this.cwd = cwd;
        this.config = config;
        this.plugins = [];
        if (this.config.plugins && this.config.plugins instanceof Array) {
            _.each(this.config.plugins, (pc) => {
                // pc == plugin config or plugin instance
                this.plugins.push(pc);
            });
        }
    }
    whenBeforeBuilding(deployment) {
        _.each(this.plugins, (p) => { p.whenBeforeBuilding(deployment); });
    }
    whenBeforeDeploying(deployment) {
        _.each(this.plugins, (p) => { p.whenBeforeDeploying(deployment); });
    }
    whenSuccess(deployment) {
        let allPromises = [];
        for (const p of this.plugins) {
            let promise = p.whenSuccess(deployment);
            if (promise) {
                allPromises.push(promise);
            }
        }
        return allPromises;
    }
    whenFailure(deployment) {
        let allPromises = [];
        for (const p of this.plugins) {
            let promise = p.whenFailure(deployment);
            if (promise) {
                allPromises.push(promise);
            }
        }
        return allPromises;
    }
    whenAfterCompleted(deployment) {
        _.each(this.plugins, (p) => { p.whenAfterCompleted(deployment); });
    }
    whenAfterDeployed(deployment) {
        _.each(this.plugins, (p) => { p.whenAfterDeployed(deployment); });
    }
}
exports.PluginRunner = PluginRunner;
var slack = require('node-slack');
class SlackNotificationPlugin extends Plugin_1.Plugin {
    constructor(config) {
        super();
        this.config = config;
        // https://github.com/xoxco/node-slack
        this.api = new slack(config.hookUrl, config.options || {});
    }
    whenBeforeBuilding(deployment) {
        this.send({
            "text": `Started building ${deployment.config.appName} ....`,
            "attachments": [
                this.createGitCommitAttachment(deployment.revInfo, {
                    "color": "#cccccc",
                    "pretext": "The deployment was created.",
                    "image_url": "http://cache.lovethispic.com/uploaded_images/thumbs/195529-First-Day-Of-Deployment-Vs-The-Last-Month.jpg",
                })
            ]
        });
    }
    whenBeforeDeploying(deployment) {
        this.send({
            "text": `Started deploying ${deployment.config.appName}...`,
            "attachments": [
                this.createGitCommitAttachment(deployment.revInfo, {
                    "color": "#999999",
                    "pretext": "The deployment is now started.",
                    "image_url": "https://media.giphy.com/media/tXLpxypfSXvUc/giphy.gif",
                })
            ]
        });
    }
    whenSuccess(deployment) {
        // Convert "deferred promise to ES6 Promise"
        var promise = this.send({
            "text": `Succeed!!!`,
            "attachments": [
                this.createGitCommitAttachment(deployment.revInfo, {
                    "color": "#39aa56",
                    "pretext": `${deployment.config.appName} is successfully deployed.`,
                    "image_url": "http://66.media.tumblr.com/tumblr_ltb3i7VfUf1qblmtj.gif",
                })
            ]
        });
        return new Promise((resolve, reject) => {
            promise.then(resolve, reject);
        });
    }
    whenFailure(deployment) {
        // Convert "deferred promise to ES6 Promise"
        var promise = this.send({
            "text": `Failed............................`,
            "attachments": [
                this.createGitCommitAttachment(deployment.revInfo, {
                    "color": "#db4545",
                    "pretext": `The deployment of ${deployment.config.appName} was failed.`,
                    "image_url": "https://media.giphy.com/media/a9xhxAxaqOfQs/giphy.gif",
                })
            ]
        });
        return new Promise((resolve, reject) => {
            promise.then(resolve, reject);
        });
    }
    linkCommitHref(hash) {
        if (this.config.github) {
            return `<https://github.com/${this.config.github.org}/${this.config.github.repo}/commit/${hash}|${hash}>`;
        }
        return hash;
    }
    createGitCommitAttachment(revInfo, extra) {
        let latestCommit = revInfo.latestCommit();
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
    }
    /**
     * @return {deferred.promise}
     */
    send(msg) {
        return this.api.send(_.extend({
            "channel": this.config.channel,
            "username": this.config.username
        }, msg));
    }
}
exports.SlackNotificationPlugin = SlackNotificationPlugin;
//# sourceMappingURL=PluginRunner.js.map