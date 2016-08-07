
import {GitSync, GitCommit, GitAuthor} from "./GitSync";

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
  let repo = new GitSync;
  let latestTag = repo.describeTags(0);
  let commits = repo.logSince(latestTag, 'HEAD');
  return {
    latestTag: latestTag,
    commits: commits,
    describe: repo.describeAll()
  } as GitRevInfo;
}

export class GitRevCollector implements RevCollector {
  public static collect(cwd:string) {
    return parseGitRepo(cwd);
  }
}
