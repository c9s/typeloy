"use strict";
var child_process = require('child_process');
var _ = require('underscore');
class GitAuthor {
}
exports.GitAuthor = GitAuthor;
class GitCommit {
}
exports.GitCommit = GitCommit;
function qq(val) {
    return "\"" + val.replace(/["]/, "\\\"") + "\"";
}
function q(val) {
    return "'" + val.replace(/[']/, "\\'") + "'";
}
const GitCommitSpliter = new RegExp('^commit\\s(?=\\w{40})', 'gm');
const GitCommitHashRegExp = new RegExp("(\\w{40})");
const GitCommitAuthorRegExp = new RegExp("^Author: (.*)\\s+<(.*?)>");
const GitCommitDateRegExp = new RegExp("^Date: (.*)$");
const EmptyLineRegExp = new RegExp("^\\s+$");
function commandOptions(defs, options) {
    let opts = [];
    _.each(defs, (def, key) => {
        let val = options[key];
        if (typeof val !== "undefined") {
            opts.push(def[0]);
            switch (def[1]) {
                case Number:
                    opts.push(val);
                    break;
                case String:
                    ;
                    opts.push(q(val));
                    break;
                case Boolean:
                    ;
                    break;
            }
        }
    });
    return opts;
}
class GitSync {
    constructor() {
    }
    /**
     * parse commit logs from text
     */
    parseCommitLogs(output) {
        let commits = output.trim().split(GitCommitSpliter);
        commits.shift(); // skip empty chunk
        return commits.map((text) => {
            let lines = text.split(/\r?\n/);
            let commit = {};
            let line, matches;
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
            commit.message = lines.map((line) => line.replace(/^\s{4}/, '')).join("\n");
            return commit;
        });
    }
    logOf(ref, options) {
        let val;
        const cmdopts = commandOptions({
            maxCount: ["--max-count", Number],
            skip: ["--skip", Number],
            until: ["--until", String],
            author: ["--author", String],
            committer: ["--committer", String],
            grep: ["--grep", String],
        }, options);
        let output = child_process.execSync(`git log ${ref} ${cmdopts.join(' ')}`, {
            "encoding": "utf8"
        });
        return this.parseCommitLogs(output);
    }
    logSince(since, til) {
        let output = child_process.execSync(`git log ${since}..${til}`, {
            "encoding": "utf8"
        }).trim();
        return this.parseCommitLogs(output);
    }
    describeAll() {
        let output = child_process.execSync(`git describe --all`, {
            "encoding": "utf8"
        });
        return output.trim();
    }
    describeTags(abbrev) {
        abbrev = abbrev || 5;
        let output = child_process.execSync(`git describe --tags --abbrev=${abbrev}`, {
            "encoding": "utf8"
        });
        return output.trim();
    }
    tags() {
        let output = child_process.execSync("git tag", {
            "encoding": "utf8"
        });
        return output.trim().split(/\r?\n/);
    }
}
exports.GitSync = GitSync;
//# sourceMappingURL=GitSync.js.map