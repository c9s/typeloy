
import {GitSync, GitCommit, GitAuthor} from "./GitSync";

const path = require('path');
const fs = require('fs');

export class GitRevInfo {
  public commits : Array<GitCommit>;
  public latestTag : string;
  public describe : string;
  public latestCommit() : GitCommit {
    return this.commits[0];
  }
}

export interface RevCollector { }

function parseGitRepo(cwd:string) : GitRevInfo {
  const repo = new GitSync(cwd);
  const latestTag = repo.describeTags(0);
  const commits = repo.logSince(latestTag, 'HEAD');
  return {
    latestTag: latestTag,
    commits: commits,
    describe: repo.describe({ tags: true })
  } as GitRevInfo;
}

function findGitWorkingRootDir(dir : string) : string {
  dir = path.resolve(dir);
  while (dir && dir.length > 1) {
    let gitDir = path.join(dir, ".git", "HEAD");
    if (fs.existsSync(gitDir)) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}

export class GitRevCollector implements RevCollector {
  public static collect(dir : string) : GitRevInfo {
    if (dir = findGitWorkingRootDir(dir)) {
      return parseGitRepo(dir);
    }
    return null;
  }
}
