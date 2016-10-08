import {GitRevCollector, GitRevInfo} from "./collectors";

import {Config} from "./config";

const path = require('path');
const uuid = require('uuid');

export class Deployment {

  /**
   * typeloy config
   */
  public config : Config;

  /**
   * deployment tag
   */
  public tag : string;

  public revInfo : GitRevInfo;


  constructor(config : Config, tag : string, revInfo : GitRevInfo = null) {
    this.config = config;
    this.tag = tag;
    this.revInfo = revInfo;
  }

  public brief() {
    let o = {
      deployment: this.tag
    };
    // rev info maybe null
    if (this.revInfo) {
      o['latestTag'] = this.revInfo.latestTag;
      o['describe'] = this.revInfo.describe;
      if (this.revInfo.commits && this.revInfo.commits.length > 0) {
        let commit = this.revInfo.commits[0];
        o['commit'] = commit.hash;
        if (commit.author) {
          o['author'] = commit.author.name;
        }
        if (commit.date) {
          o['committedAt'] = commit.date.toLocaleString();
        }
      }
    }
    return o;
  }

  /**
   * @param dir dir is used for git collector to collect information
   */
  public static create(config : Config, tag:string = null) : Deployment {
    let dir = config.app.directory || config.app.root || path.resolve('.');
    let revInfo = GitRevCollector.collect(dir);
    if (!tag && revInfo) {
      tag = revInfo.describe;
    }
    if (!tag) {
      tag = uuid.v4();
    }
    return new Deployment(config, tag, revInfo);
  }
}
