var child_process = require('child_process');
var path = require('path');
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

export function commandOptions(defs, options) : Array<string> {
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
/*
console.log(error.stack);
console.log('Error code: '+error.code);
console.log('Signal received: '+error.signal);
*/


export class GitRepo {

  protected repo : string;

  protected sharedOptions;

  constructor(repo : string, options = null) {
    this.repo = path.resolve(repo);
    this.sharedOptions = options || {
      'workTree': this.repo,
      'gitDir': path.join(this.repo, '.git'),
    };
  }

  protected baseCommand() : Array<string> {
    return ['git'].concat(commandOptions({
      "gitDir": ["--git-dir", String],
      "workTree": ["--work-tree", String],
    }, this.sharedOptions));
  }

  public deleteBranch(branch : string, options : any = {}) {
    const cmd = this.baseCommand().join(' ');
    const cmdopts = [];
    if (options.force) {
      cmdopts.push('-D');
    } else {
      cmdopts.push('-d');
    }
    return new Promise<any>(resolve => {
      let process = child_process.exec(`${cmd} branch ${cmdopts.join(' ')} ${branch}`, { cwd: this.repo }, (err, stdout, stderr) => {
        resolve({ err, stdout, stderr });
      });
    });
  }

  public checkout(branch : string, options = {}) : Promise<any> {
    const cmd = this.baseCommand().join(' ');
    const cmdopts = commandOptions({
      "track": ["--track", String],
      "force": ["-f", Boolean],
    }, options);
    return new Promise<any>(resolve => {
      let process = child_process.exec(`${cmd} checkout ${cmdopts.join(' ')} ${branch}`, { cwd: this.repo }, (err, stdout, stderr) => {
        resolve({ err, stdout, stderr });
      });
    });
  }

  public fetch(remote : string, options = {}) : Promise<any> {
    const cmd = this.baseCommand().join(' ');
    const cmdopts = commandOptions({
      "all": ["--all", Boolean],
      "prune": ["--prune", Boolean],
      "tags": ["--tags", Boolean],
      "quiet": ["--quiet", Boolean],
      "verbose": ["--verbose", Boolean],
    }, options);

    return new Promise(resolve => {
      let process = child_process.exec(`${cmd} fetch ${cmdopts.join(' ')} ${remote}`, { cwd: this.repo }, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr });
      });
    });
  }

  public clean(options = {}) : Promise<any> {
    const cmd = this.baseCommand().join(' ');
    const cmdopts = commandOptions({
      "removeUntrackedDirectory": ["-d", Boolean],
      "force": ["--force", Boolean],
      "quiet": ["--quiet", Boolean],
    }, options);
    return new Promise<any>(resolve => {
      let process = child_process.exec(`${cmd} clean ${cmdopts.join(' ')}`, { cwd: this.repo }, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr });
      });
    });
  }

  public reset(options = {}) : Promise<any> {
    const cmd = this.baseCommand().join(' ');
    const cmdopts = commandOptions({
      "hard": ["--hard", Boolean],
    }, options);
    return new Promise<any>(resolve => {
      let process = child_process.exec(`${cmd} reset ${cmdopts.join(' ')}`, { cwd: this.repo }, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr });
      });
    });
  }

  public submoduleUpdate(options = {}) : Promise<any> {
    const cmd = this.baseCommand().join(' ');
    const cmdopts = commandOptions({
      "force": ["--force", Boolean],
      "init": ["--init", Boolean],
      "recursive": ["--recursive", Boolean],
    }, options);
    return new Promise<any>(resolve => {
      let process = child_process.exec(`${cmd} submodule update ${cmdopts.join(' ')}`, { cwd: this.repo }, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr });
      });
    });
  }

  public pull(remote = 'origin', branch : string = '', options = {}) : Promise<any> {
    const cmd = this.baseCommand().join(' ');
    const cmdopts = commandOptions({
      "rebase": ["--rebase", Boolean],
    }, options);

    return new Promise<any>(resolve => {
      let process = child_process.exec(`${cmd} pull ${cmdopts.join(' ')} ${remote} ${branch}`, { cwd: this.repo }, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr });
      });
    });
  }



}

export class GitUtils {

  /**
   * parse commit logs from text
   */
  public static parseCommitLogs(output:string) : Array<GitCommit> {
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
}

export class GitSync extends GitRepo {

  public logOf(ref, options) {
    const cmd = this.baseCommand().join(' ');
    const cmdopts = commandOptions({
      maxCount: ["--max-count", Number],
      skip: ["--skip", Number],
      until: ["--until", String],
      author: ["--author", String],
      committer: ["--committer", String],
      grep: ["--grep", String],
    }, options);
    let output = child_process.execSync(`${cmd} log ${ref} ${cmdopts.join(' ')}`, {
      "encoding": "utf8"
    });
    return GitUtils.parseCommitLogs(output);
  }

  public logSince(since, til) {
    const cmd = this.baseCommand().join(' ');
    let output = child_process.execSync(`${cmd} log ${since}..${til}`, {
      "encoding": "utf8"
    }).trim();
    return GitUtils.parseCommitLogs(output);
  }


  public describeAll() {
    const cmd = this.baseCommand().join(' ');
    let output = child_process.execSync(`${cmd} describe --all`, {
      "encoding": "utf8"
    });
    return output.trim();
  }

  public describeTags(abbrev : number = 5) {
    const cmd = this.baseCommand().join(' ');
    let output = child_process.execSync(`${cmd} describe --tags --abbrev=${abbrev}`, {
      "encoding": "utf8"
    });
    return output.trim();
  }

  public describe(options = {}) {
    const cmd = this.baseCommand().join(' ');
    const cmdopts = commandOptions({
      'dirty': ["--dirty", Boolean],
      'all': ["--all", Boolean],
      'tags': ["--tags", Boolean],
      'contains': ["--contains", Boolean],
      'abbrev': ["--abbrev", Number],
      'long': ["--long", Boolean],
      'match': ["--match", String],
    }, options);
    const output = child_process.execSync(`${cmd} describe ${cmdopts.join(' ')}`, {
      "encoding": "utf8"
    });
    return output.trim();
  }

  public tags() {
    const cmd = this.baseCommand().join(' ');
    let output = child_process.execSync(`${cmd} tag`, {
      "encoding": "utf8"
    });
    return output.trim().split(/\r?\n/);
  }
}
