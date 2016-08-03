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

  public static async create(config:Config, cwd:string, tag:string) {
    let revInfo = await GitRevCollector.collect(cwd);
    return new Deployment(config, tag, revInfo);
  }
}
