import {GitRevCollector, GitRevInfo} from "./collectors";

export default class Deployment {

  public tag:string;

  public revInfo:any;

  constructor(tag:string, revInfo) {
    this.tag = tag;
    this.revInfo = revInfo;
  }

  public static async create(cwd:string, tag:string) {
    let revInfo = await GitRevCollector.collect(cwd);
    return new Deployment(tag, revInfo);
  }
}
