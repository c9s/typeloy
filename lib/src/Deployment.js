"use strict";
var collectors_1 = require("./collectors");
var Deployment = (function () {
    function Deployment(config, tag, revInfo) {
        this.config = config;
        this.tag = tag;
        this.revInfo = revInfo;
    }
    Deployment.create = function (config, cwd, tag) {
        var revInfo = collectors_1.GitRevCollector.collect(cwd);
        return new Deployment(config, tag, revInfo);
    };
    return Deployment;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Deployment;
//# sourceMappingURL=Deployment.js.map