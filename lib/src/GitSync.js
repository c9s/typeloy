"use strict";
var child_process = require('child_process');
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
        let cmdopts = [];
        let val;
        if (val = options.maxCount) {
            cmdopts.push('--max-count', val);
        }
        if (val = options.skip) {
            cmdopts.push('--skip', val);
        }
        if (val = options.until) {
            cmdopts.push('--until', val);
        }
        if (val = options.author) {
            cmdopts.push('--author', val);
        }
        if (val = options.committer) {
            cmdopts.push('--committer', val);
        }
        if (val = options.grep) {
            cmdopts.push('--grep', val);
        }
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