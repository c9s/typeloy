"use strict";
const collectors_1 = require("./collectors");
class Deployment {
    constructor(config, tag, revInfo) {
        this.config = config;
        this.tag = tag;
        this.revInfo = revInfo;
    }
    static create(config, cwd, tag) {
        let revInfo = collectors_1.GitRevCollector.collect(cwd);
        return new Deployment(config, tag, revInfo);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Deployment;
//# sourceMappingURL=Deployment.js.map