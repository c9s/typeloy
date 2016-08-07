"use strict";
const GitSync_1 = require("./GitSync");
class GitRevInfo {
    latestCommit() {
        return this.commits[0];
    }
}
exports.GitRevInfo = GitRevInfo;
function parseGitRepo(cwd) {
    let repo = new GitSync_1.GitSync;
    let latestTag = repo.describeTags(0);
    let commits = repo.logSince(latestTag, 'HEAD');
    return {
        latestTag: latestTag,
        commits: commits,
        describe: repo.describeAll()
    };
}
class GitRevCollector {
    static collect(cwd) {
        return parseGitRepo(cwd);
    }
}
exports.GitRevCollector = GitRevCollector;
//# sourceMappingURL=collectors.js.map