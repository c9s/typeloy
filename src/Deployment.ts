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

  public static create(config : Config, dir:string, tag:string = null) : Deployment {
    let revInfo = GitRevCollector.collect(dir);
    if (!tag) {
      tag = revInfo.describe;
    }
    return new Deployment(config, tag, revInfo);
  }
}
