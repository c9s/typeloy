"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var GitRepo = require('simple-git');
function parseGitRepo(cwd) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            let repo = GitRepo(cwd);
            let info = {};
            repo.tags((err, tags) => {
                info.latestTag = tags.latest;
                repo.log({ from: tags.latest, to: 'HEAD' }, (err, ret) => {
                    info.commit = ret.latest;
                    info.commitsAfterLatestTag = ret.all;
                    info.numberOfCommitsAfterLatestTag = ret.total;
                }).diff((err, diff) => {
                    info.diff = diff;
                }).diffSummary((err, diffStats) => {
                    info.diffStats = diffStats;
                }).then(() => {
                    resolve(info);
                });
                ;
            });
        });
    });
}
class GitRevCollector {
    static collect(cwd) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield parseGitRepo(cwd);
        });
    }
}
exports.GitRevCollector = GitRevCollector;
//# sourceMappingURL=collectors.js.map