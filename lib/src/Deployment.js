"use strict";
var collectors_1 = require("./collectors");
var path = require('path');
var uuid = require('uuid');
var Deployment = (function () {
    function Deployment(config, tag, revInfo) {
        if (revInfo === void 0) { revInfo = null; }
        this.config = config;
        this.tag = tag;
        this.revInfo = revInfo;
    }
    Deployment.prototype.brief = function () {
        var o = {
            deployment: this.tag
        };
        // rev info maybe null
        if (this.revInfo) {
            o['latestTag'] = this.revInfo.latestTag;
            o['describe'] = this.revInfo.describe;
            if (this.revInfo.commits && this.revInfo.commits.length > 0) {
                var commit = this.revInfo.commits[0];
                o['commit'] = commit.hash;
                if (commit.author) {
                    o['author'] = commit.author.name;
                }
                if (commit.date) {
                    o['committedAt'] = commit.date.toLocaleString();
                }
            }
        }
        return o;
    };
    /**
     * @param dir dir is used for git collector to collect information
     */
    Deployment.create = function (config, tag) {
        if (tag === void 0) { tag = null; }
        var dir = config.app.directory || config.app.root || path.resolve('.');
        var revInfo = collectors_1.GitRevCollector.collect(dir);
        if (!tag && revInfo) {
            tag = revInfo.describe;
        }
        if (!tag) {
            tag = uuid.v4();
        }
        return new Deployment(config, tag, revInfo);
    };
    return Deployment;
}());
exports.Deployment = Deployment;
//# sourceMappingURL=Deployment.js.map