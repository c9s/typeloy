"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var child_process = require('child_process');
var path = require('path');
var _ = require('underscore');
var GitAuthor = (function () {
    function GitAuthor() {
    }
    return GitAuthor;
}());
exports.GitAuthor = GitAuthor;
var GitCommit = (function () {
    function GitCommit() {
    }
    return GitCommit;
}());
exports.GitCommit = GitCommit;
function qq(val) {
    return "\"" + val.replace(/["]/, "\\\"") + "\"";
}
function q(val) {
    return "'" + val.replace(/[']/, "\\'") + "'";
}
var GitCommitSpliter = new RegExp('^commit\\s(?=\\w{40})', 'gm');
var GitCommitHashRegExp = new RegExp("(\\w{40})");
var GitCommitAuthorRegExp = new RegExp("^Author: (.*)\\s+<(.*?)>");
var GitCommitDateRegExp = new RegExp("^Date: (.*)$");
var EmptyLineRegExp = new RegExp("^\\s+$");
function commandOptions(defs, options) {
    var opts = [];
    _.each(defs, function (def, key) {
        var val = options[key];
        if (typeof val !== "undefined") {
            opts.push(def[0]);
            switch (def[1]) {
                case Number:
                    opts.push(val);
                    break;
                case String:
                    opts.push(q(val));
                    break;
                case Boolean:
                    break;
            }
        }
    });
    return opts;
}
exports.commandOptions = commandOptions;
/*
console.log(error.stack);
console.log('Error code: '+error.code);
console.log('Signal received: '+error.signal);
*/
var GitRepo = (function () {
    function GitRepo(repo, options) {
        if (options === void 0) { options = null; }
        this.repo = path.resolve(repo);
        this.sharedOptions = options || {
            'workTree': this.repo,
            'gitDir': path.join(this.repo, '.git'),
        };
    }
    GitRepo.prototype.baseCommand = function () {
        return ['git'].concat(commandOptions({
            "gitDir": ["--git-dir", String],
            "workTree": ["--work-tree", String],
        }, this.sharedOptions));
    };
    GitRepo.prototype.deleteBranch = function (branch, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var cmd = this.baseCommand().join(' ');
        var cmdopts = [];
        if (options.force) {
            cmdopts.push('-D');
        }
        else {
            cmdopts.push('-d');
        }
        return new Promise(function (resolve) {
            var process = child_process.exec(cmd + " branch " + cmdopts.join(' ') + " " + branch, { cwd: _this.repo }, function (err, stdout, stderr) {
                resolve({ err: err, stdout: stdout, stderr: stderr });
            });
        });
    };
    GitRepo.prototype.checkout = function (branch, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var cmd = this.baseCommand().join(' ');
        var cmdopts = commandOptions({
            "track": ["--track", String],
            "force": ["-f", Boolean],
        }, options);
        return new Promise(function (resolve) {
            var process = child_process.exec(cmd + " checkout " + cmdopts.join(' ') + " " + branch, { cwd: _this.repo }, function (err, stdout, stderr) {
                resolve({ err: err, stdout: stdout, stderr: stderr });
            });
        });
    };
    GitRepo.prototype.fetch = function (remote, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var cmd = this.baseCommand().join(' ');
        var cmdopts = commandOptions({
            "all": ["--all", Boolean],
        }, options);
        return new Promise(function (resolve) {
            var process = child_process.exec(cmd + " fetch " + cmdopts.join(' ') + " " + remote, { cwd: _this.repo }, function (error, stdout, stderr) {
                resolve({ error: error, stdout: stdout, stderr: stderr });
            });
        });
    };
    GitRepo.prototype.clean = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var cmd = this.baseCommand().join(' ');
        var cmdopts = commandOptions({
            "removeUntrackedDirectory": ["-d", Boolean],
            "force": ["--force", Boolean],
            "quiet": ["--quiet", Boolean],
        }, options);
        return new Promise(function (resolve) {
            var process = child_process.exec(cmd + " clean " + cmdopts.join(' '), { cwd: _this.repo }, function (error, stdout, stderr) {
                resolve({ error: error, stdout: stdout, stderr: stderr });
            });
        });
    };
    GitRepo.prototype.reset = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var cmd = this.baseCommand().join(' ');
        var cmdopts = commandOptions({
            "hard": ["--hard", Boolean],
        }, options);
        return new Promise(function (resolve) {
            var process = child_process.exec(cmd + " reset " + cmdopts.join(' '), { cwd: _this.repo }, function (error, stdout, stderr) {
                resolve({ error: error, stdout: stdout, stderr: stderr });
            });
        });
    };
    GitRepo.prototype.submoduleUpdate = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var cmd = this.baseCommand().join(' ');
        var cmdopts = commandOptions({
            "force": ["--force", Boolean],
            "init": ["--init", Boolean],
            "recursive": ["--recursive", Boolean],
        }, options);
        return new Promise(function (resolve) {
            var process = child_process.exec(cmd + " submodule update " + cmdopts.join(' '), { cwd: _this.repo }, function (error, stdout, stderr) {
                resolve({ error: error, stdout: stdout, stderr: stderr });
            });
        });
    };
    GitRepo.prototype.pull = function (remote, branch, options) {
        var _this = this;
        if (remote === void 0) { remote = 'origin'; }
        if (branch === void 0) { branch = ''; }
        if (options === void 0) { options = {}; }
        var cmd = this.baseCommand().join(' ');
        var cmdopts = commandOptions({
            "rebase": ["--rebase", Boolean],
        }, options);
        return new Promise(function (resolve) {
            var process = child_process.exec(cmd + " pull " + cmdopts.join(' ') + " " + remote + " " + branch, { cwd: _this.repo }, function (error, stdout, stderr) {
                resolve({ error: error, stdout: stdout, stderr: stderr });
            });
        });
    };
    return GitRepo;
}());
exports.GitRepo = GitRepo;
var GitUtils = (function () {
    function GitUtils() {
    }
    /**
     * parse commit logs from text
     */
    GitUtils.parseCommitLogs = function (output) {
        var commits = output.trim().split(GitCommitSpliter);
        commits.shift(); // skip empty chunk
        return commits.map(function (text) {
            var lines = text.split(/\r?\n/);
            var commit = {};
            var line, matches;
            line = lines.shift();
            if (matches = line.match(GitCommitHashRegExp)) {
                commit.hash = matches[1];
            }
            line = lines.shift();
            if (matches = line.match(GitCommitAuthorRegExp)) {
                commit.author = { name: matches[1], email: matches[2] };
            }
            line = lines.shift();
            if (matches = line.match(GitCommitDateRegExp)) {
                commit.date = new Date(matches[1]);
            }
            lines.shift(); // ignore first empty line
            while (lines[lines.length - 1].match(EmptyLineRegExp)) {
                lines.pop();
            }
            commit.message = lines.map(function (line) { return line.replace(/^\s{4}/, ''); }).join("\n");
            return commit;
        });
    };
    return GitUtils;
}());
exports.GitUtils = GitUtils;
var GitSync = (function (_super) {
    __extends(GitSync, _super);
    function GitSync() {
        _super.apply(this, arguments);
    }
    GitSync.prototype.logOf = function (ref, options) {
        var cmd = this.baseCommand().join(' ');
        var cmdopts = commandOptions({
            maxCount: ["--max-count", Number],
            skip: ["--skip", Number],
            until: ["--until", String],
            author: ["--author", String],
            committer: ["--committer", String],
            grep: ["--grep", String],
        }, options);
        var output = child_process.execSync(cmd + " log " + ref + " " + cmdopts.join(' '), {
            "encoding": "utf8"
        });
        return GitUtils.parseCommitLogs(output);
    };
    GitSync.prototype.logSince = function (since, til) {
        var cmd = this.baseCommand().join(' ');
        var output = child_process.execSync(cmd + " log " + since + ".." + til, {
            "encoding": "utf8"
        }).trim();
        return GitUtils.parseCommitLogs(output);
    };
    GitSync.prototype.describeAll = function () {
        var cmd = this.baseCommand().join(' ');
        var output = child_process.execSync(cmd + " describe --all", {
            "encoding": "utf8"
        });
        return output.trim();
    };
    GitSync.prototype.describeTags = function (abbrev) {
        if (abbrev === void 0) { abbrev = 5; }
        var cmd = this.baseCommand().join(' ');
        var output = child_process.execSync(cmd + " describe --tags --abbrev=" + abbrev, {
            "encoding": "utf8"
        });
        return output.trim();
    };
    GitSync.prototype.describe = function (options) {
        if (options === void 0) { options = {}; }
        var cmd = this.baseCommand().join(' ');
        var cmdopts = commandOptions({
            'dirty': ["--dirty", Boolean],
            'all': ["--all", Boolean],
            'tags': ["--tags", Boolean],
            'contains': ["--contains", Boolean],
            'abbrev': ["--abbrev", Number],
            'long': ["--long", Boolean],
            'match': ["--match", String],
        }, options);
        var output = child_process.execSync(cmd + " describe " + cmdopts.join(' '), {
            "encoding": "utf8"
        });
        return output.trim();
    };
    GitSync.prototype.tags = function () {
        var cmd = this.baseCommand().join(' ');
        var output = child_process.execSync(cmd + " tag", {
            "encoding": "utf8"
        });
        return output.trim().split(/\r?\n/);
    };
    return GitSync;
}(GitRepo));
exports.GitSync = GitSync;
//# sourceMappingURL=GitSync.js.map