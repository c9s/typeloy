var GitRepo = require('simple-git');

export interface GitRevInfo {
  rev: string;
  abbrev: string;
  user: string;
  date: Date;
  localChanges: string;

  latestTag : string;
  latestCommit : any;
  commitsAfterLatestTag : any;
  numberOfCommitsAfterLatestTag : number;
  diff : any;
  diffStats : any;
}

export interface RevCollector { }


async function parseGitRepo(cwd:string) {
  return new Promise<any>(resolve => {
    let repo = GitRepo(cwd);
    let info:any = {};
    repo.tags((err:any, tags:any) => {
      // console.log("Latest available tag: %s", tags.latest);
      info.latestTag = tags.latest;
      repo.log({ from: tags.latest, to: 'HEAD' }, (err, ret) => {
        info.latestCommit = ret.latest;
        info.commitsAfterLatestTag = ret.all;
        info.numberOfCommitsAfterLatestTag = ret.total;
      })
      repo.diff((err, diff) => {
        info.diff = diff;
      });
      repo.diffSummary((err, diffStats) => {
        info.diffStats = diffStats;
      }).then(() => {
        resolve(info);
      });
      ;
    });
  });
}

export class GitRevCollector implements RevCollector {

  public static async collect(cwd:string) {
    return await parseGitRepo(cwd);
  }
}
