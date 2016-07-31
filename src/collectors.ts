var GitRepo = require('simple-git');

interface GitCommit {
  hash : string;
  date : string;
  message : string;
  author_name: string;
  author_email : string;
}

export interface GitRevInfo {
  commit : GitCommit;
  commitsAfterLatestTag : any;
  latestTag : string;
  numberOfCommitsAfterLatestTag : number;
  diff : any;
  diffStats : any;
}

export interface RevCollector { }

async function parseGitRepo(cwd:string) {
  return new Promise<any>(resolve => {
    let repo = GitRepo(cwd);
    let info:GitRevInfo = {} as GitRevInfo;
    repo.tags((err:any, tags:any) => {
      info.latestTag = tags.latest;
      repo.log({ from: tags.latest, to: 'HEAD' }, (err, ret) => {
        info.commit = <GitCommit>ret.latest;
        info.commitsAfterLatestTag = ret.all;
        info.numberOfCommitsAfterLatestTag = ret.total;
      }).diff((err, diff) => {
        info.diff = diff;
      }).diffSummary((err, diffStats) => {
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
