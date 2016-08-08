"use strict";
var child_process = require('child_process');
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
var GitSync = (function () {
    function GitSync() {
    }
    /**
     * parse commit logs from text
     */
    GitSync.prototype.parseCommitLogs = function (output) {
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
    GitSync.prototype.logOf = function (ref, options) {
        var cmdopts = commandOptions({
            maxCount: ["--max-count", Number],
            skip: ["--skip", Number],
            until: ["--until", String],
            author: ["--author", String],
            committer: ["--committer", String],
            grep: ["--grep", String],
        }, options);
        var output = child_process.execSync("git log " + ref + " " + cmdopts.join(' '), {
            "encoding": "utf8"
        });
        return this.parseCommitLogs(output);
    };
    GitSync.prototype.logSince = function (since, til) {
        var output = child_process.execSync("git log " + since + ".." + til, {
            "encoding": "utf8"
        }).trim();
        return this.parseCommitLogs(output);
    };
    GitSync.prototype.describeAll = function () {
        var output = child_process.execSync("git describe --all", {
            "encoding": "utf8"
        });
        return output.trim();
    };
    GitSync.prototype.describeTags = function (abbrev) {
        abbrev = abbrev || 5;
        var output = child_process.execSync("git describe --tags --abbrev=" + abbrev, {
            "encoding": "utf8"
        });
        return output.trim();
    };
    GitSync.prototype.describe = function (options) {
        var cmdopts = commandOptions({
            'dirty': ["--dirty", Boolean],
            'all': ["--all", Boolean],
            'tags': ["--tags", Boolean],
            'contains': ["--contains", Boolean],
            'abbrev': ["--abbrev", Number],
            'long': ["--long", Boolean],
            'match': ["--match", String],
        }, options);
        var output = child_process.execSync("git describe " + cmdopts.join(' '), {
            "encoding": "utf8"
        });
        return output.trim();
    };
    GitSync.prototype.tags = function () {
        var output = child_process.execSync("git tag", {
            "encoding": "utf8"
        });
        return output.trim().split(/\r?\n/);
    };
    return GitSync;
}());
exports.GitSync = GitSync;
//# sourceMappingURL=GitSync.js.map