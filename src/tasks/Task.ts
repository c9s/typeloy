import {Config, AppConfig} from "../config";
import {Session, SessionResult, executeScript, sync} from "../Session";

const path = require('path');
const _ = require('underscore');

export const SCRIPT_DIR = path.resolve(__dirname, '../../../scripts/ubuntu');
export const TEMPLATES_DIR = path.resolve(__dirname, '../../../templates/ubuntu');

export abstract class Task {

  protected config : Config;

  protected appRoot : string;

  protected deployPrefix : string;

  /**
   * new code
   */
  protected _input : any;

  protected _output : any;

  constructor(config : Config) {
    this.config = config;
    this.deployPrefix = '/opt';
    this.appRoot = this.deployPrefix + '/' + this.config.app.name;
  }

  public abstract describe();

  public abstract build(taskList);

  public abstract run(session : Session) : Promise<SessionResult>;

  public input(i) {
    this._input = i;
    return this;
  }

  public output(o) {
    this._output = o;
    return this;
  }


  public getOutput() {
    return this._output;
  }

  public getInput() {
    return this._input;
  }

  protected getAppRoot() : string {
    return path.join(this.deployPrefix, this.config.app.name);
  }

  protected getAppName() : string {
    return this.config.app.name;
  }

  protected extendArgs(args) {
    return _.extend({
        'deployPrefix': this.deployPrefix,
        'appRoot': this.appRoot,
        'appName': this.config.app.name
    }, args);
  }
}
