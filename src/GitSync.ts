var child_process = require('child_process');
var _ = require('underscore');

export class GitAuthor {
  name: string;
  email: string;
}

export class GitCommit {
  hash: string;
  author: GitAuthor;
  message: string;
  date: Date;
}


function qq(val : string) : string {
  return "\"" + val.replace(/["]/, "\\\"") + "\"";
}

function q(val : string) : string {
  return "'" + val.replace(/[']/, "\\'") + "'";
}

const GitCommitSpliter = new RegExp('^commit\\s(?=\\w{40})', 'gm');
const GitCommitHashRegExp = new RegExp("(\\w{40})");
const GitCommitAuthorRegExp = new RegExp("^Author: (.*)\\s+<(.*?)>");
const GitCommitDateRegExp = new RegExp("^Date: (.*)$");
const EmptyLineRegExp = new RegExp("^\\s+$");




function commandOptions(defs, options) : Array<string> {
  let opts : Array<string> = [];
  _.each(defs, (def, key:string) => {
    let val = options[key];
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



export class GitSync {
  constructor() {

  }

  /**
   * parse commit logs from text
   */
  protected parseCommitLogs(output:string) : Array<GitCommit> {
    let commits = output.trim().split(GitCommitSpliter);
    commits.shift(); // skip empty chunk

    return commits.map((text) : GitCommit => {
      let lines = text.split(/\r?\n/);
      let commit:GitCommit = {} as GitCommit;
      let line, matches;
      
      line = lines.shift();
      if (matches = line.match(GitCommitHashRegExp)) {
        commit.hash = matches[1];
      }

      line = lines.shift();
      if (matches = line.match(GitCommitAuthorRegExp)) {
        commit.author = { name: matches[1], email: matches[2] } as GitAuthor;
      }

      line = lines.shift();
      if (matches = line.match(GitCommitDateRegExp)) {
        commit.date = new Date(matches[1]);
      }
      lines.shift(); // ignore first empty line
      while (lines[lines.length - 1].match(EmptyLineRegExp)) {
        lines.pop();
      }
      commit.message = lines.map((line:string) => line.replace(/^\s{4}/,'') ).join("\n");
      return commit;
    });

  }


  public logOf(ref, options) {
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

  public logSince(since, til) {
    let output = child_process.execSync(`git log ${since}..${til}`, {
      "encoding": "utf8"
    }).trim();
    return this.parseCommitLogs(output);
  }


  public describeAll() {
    let output = child_process.execSync(`git describe --all`, {
      "encoding": "utf8"
    });
    return output.trim();
  }

  public describeTags(abbrev) {
    abbrev = abbrev || 5;
    let output = child_process.execSync(`git describe --tags --abbrev=${abbrev}`, {
      "encoding": "utf8"
    });
    return output.trim();
  }

  public describe(options) {
    const cmdopts = commandOptions({
      'dirty': ["--dirty", Boolean],
      'all': ["--all", Boolean],
      'tags': ["--tags", Boolean],
      'contains': ["--contains", Boolean],
      'abbrev': ["--abbrev", Number],
      'long': ["--long", Boolean],
      'match': ["--match", String],
    }, options);
    const output = child_process.execSync(`git describe ${cmdopts.join(' ')}`, {
      "encoding": "utf8"
    });
    return output.trim();
  }



  public tags() {
    let output = child_process.execSync("git tag", {
      "encoding": "utf8"
    });
    return output.trim().split(/\r?\n/);
  }
}

