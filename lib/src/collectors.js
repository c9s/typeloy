"use strict";
var GitSync_1 = require("./GitSync");
var path = require('path');
var fs = require('fs');
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
    var repo = new GitSync_1.GitSync(cwd);
    var latestTag = repo.describeTags(0);
    var commits = repo.logSince(latestTag, 'HEAD');
    return {
        latestTag: latestTag,
        commits: commits,
        describe: repo.describe({ tags: true })
    };
}
/**
 * Dir: absolute path for the app dir
 */
function findGitWorkingRootDir(dir) {
    var abspath = path.resolve(dir);
    var parts = abspath.split(path.sep);
    while (parts.length > 1) {
        var dir_1 = parts.join(path.sep);
        var gitDir = path.join(dir_1, ".git", "HEAD");
        if (fs.existsSync(gitDir)) {
            return dir_1;
        }
        parts.pop();
    }
    return null;
}
var GitRevCollector = (function () {
    function GitRevCollector() {
    }
    GitRevCollector.collect = function (dir) {
        if (dir = findGitWorkingRootDir(dir)) {
            return parseGitRepo(dir);
        }
        return null;
    };
    return GitRevCollector;
}());
exports.GitRevCollector = GitRevCollector;
//# sourceMappingURL=collectors.js.map