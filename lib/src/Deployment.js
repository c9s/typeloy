"use strict";
var collectors_1 = require("./collectors");
var Deployment = (function () {
    function Deployment(config, tag, revInfo) {
        this.config = config;
        this.tag = tag;
        this.revInfo = revInfo;
    }
    /**
     * @param dir dir is used for git collector to collect information
     */
    Deployment.create = function (config, dir, tag) {
        if (tag === void 0) { tag = null; }
        var revInfo = collectors_1.GitRevCollector.collect(dir);
        if (!tag) {
            tag = revInfo.describe;
        }
        return new Deployment(config, tag, revInfo);
    };
    return Deployment;
}());
exports.Deployment = Deployment;
//# sourceMappingURL=Deployment.js.map