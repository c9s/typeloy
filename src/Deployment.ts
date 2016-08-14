import {GitRevCollector, GitRevInfo} from "./collectors";

import {Config} from "./config";

export class Deployment {

  /**
   * deployment tag
   */
  public tag : string;

  public revInfo : GitRevInfo;

  public config : Config;

  constructor(config : Config, tag:string, revInfo:GitRevInfo) {
    this.config = config;
    this.tag = tag;
    this.revInfo = revInfo;
  }

  public brief() {
    return {
      deployment: this.tag,
      latestTag: this.revInfo.latestTag,
      describe: this.revInfo.describe,
      commit: this.revInfo.commits[0].hash,
      author: this.revInfo.commits[0].author.name,
      committedAt: this.revInfo.commits[0].date.toLocaleString()
    };
  }

  /**
   * @param dir dir is used for git collector to collect information
   */
  public static create(config : Config, dir:string, tag:string = null) : Deployment {
    let revInfo = GitRevCollector.collect(dir);
    if (!tag) {
      tag = revInfo.describe;
    }
    return new Deployment(config, tag, revInfo);
  }
}
