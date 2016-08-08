"use strict";
var GitSync_1 = require("./GitSync");
var GitRevInfo = (function () {
    function GitRevInfo() {
    }
    GitRevInfo.prototype.latestCommit = function () {
        return this.commits[0];
    };
    return GitRevInfo;
}());
exports.GitRevInfo = GitRevInfo;
function parseGitRepo(cwd) {
    var repo = new GitSync_1.GitSync;
    var latestTag = repo.describeTags(0);
    var commits = repo.logSince(latestTag, 'HEAD');
    return {
        latestTag: latestTag,
        commits: commits,
        describe: repo.describeAll()
    };
}
var GitRevCollector = (function () {
    function GitRevCollector() {
    }
    GitRevCollector.collect = function (cwd) {
        return parseGitRepo(cwd);
    };
    return GitRevCollector;
}());
exports.GitRevCollector = GitRevCollector;
//# sourceMappingURL=collectors.js.map