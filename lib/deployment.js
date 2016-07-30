"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const collectors_1 = require("./collectors");
class Deployment {
    constructor(tag, revInfo) {
        this.tag = tag;
        this.revInfo = revInfo;
    }
    static create(cwd, tag) {
        return __awaiter(this, void 0, void 0, function* () {
            let revInfo = yield collectors_1.GitRevCollector.collect(cwd);
            return new Deployment(tag, revInfo);
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Deployment;
//# sourceMappingURL=deployment.js.map