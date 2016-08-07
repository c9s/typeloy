import {GitRevCollector, GitRevInfo} from "./collectors";

import {Config} from "./config";

export default class Deployment {

  /**
   * deployment tag
   */
  public tag:string;

  public revInfo:GitRevInfo;

  public config:Config;

  constructor(config:Config, tag:string, revInfo:GitRevInfo) {
    this.config = config;
    this.tag = tag;
    this.revInfo = revInfo;
  }

  public static create(config:Config, cwd:string, tag:string) : Deployment {
    let revInfo = GitRevCollector.collect(cwd);
    return new Deployment(config, tag, revInfo);
  }
}
