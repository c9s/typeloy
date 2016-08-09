import {Config} from "./config";

import {GitRevCollector, GitRevInfo} from "./collectors";
import Deployment from "./Deployment";
import {Plugin} from "./Plugin";

var _ = require('underscore');

export class PluginRunner {

  protected config:Config;

  protected cwd:string;

  protected plugins:Array<Plugin> = [];

  constructor(config:Config, cwd:string) {
    this.cwd = cwd;
    this.config = config;
    this.plugins = [];
    if (this.config.plugins && this.config.plugins instanceof Array) {
      _.each(this.config.plugins, (pc) => {
        // pc == plugin config or plugin instance
        this.plugins.push(pc);
      });
    }
  }

  public whenBeforeBuilding(deployment : Deployment) {
    _.each(this.plugins, (p) => { p.whenBeforeBuilding(deployment); });
  }

  public whenBeforeDeploying(deployment : Deployment) {
    _.each(this.plugins, (p) => { p.whenBeforeDeploying(deployment); });
  }

  public whenSuccess(deployment : Deployment) : Promise<any> {
    console.log("whenSuccess");
    let promises = _.map(this.plugins, (p) => {
      return p.whenSuccess(deployment);
    }).compact();
    if (promises.length == 0) {
      return;
    }
    return Promise.all(promises);
  }

  public whenFailure(deployment:Deployment) : Promise<any> {
    console.log("whenFailure");
    let promises = _.map(this.plugins, (p) => {
      return p.whenFailure(deployment);
    }).compact();
    if (promises.length == 0) {
      return;
    }
    return Promise.all(promises);
  }

  public whenAfterCompleted(deployment:Deployment) {
    _.each(this.plugins, (p) => { p.whenAfterCompleted(deployment); });
  }

  public whenAfterDeployed(deployment:Deployment) {
    _.each(this.plugins, (p) => { p.whenAfterDeployed(deployment); });
  }
}





var slack = require('node-slack');

/***
 * 
 */
interface SlackNotificationPluginGitHubConfig {
  org  : string;
  repo : string;
}

interface SlackNotificationPluginConfig {
  channel : string;
  username : string;
  hookUrl : string;
  options: any;
  github?: SlackNotificationPluginGitHubConfig;
}

export class SlackNotificationPlugin extends Plugin {

  protected api:any;

  protected config : SlackNotificationPluginConfig;

  constructor(config:SlackNotificationPluginConfig) {
    super();
    this.config = config;
    // https://github.com/xoxco/node-slack
    this.api = new slack(config.hookUrl, config.options || {});
  }

  public whenBeforeBuilding(deployment:Deployment) {
    this.send({
      "text": `Started building ${deployment.config.appName} ....`,
      "attachments":[
        this.createGitCommitAttachment(deployment.revInfo, {
          "color": "#cccccc", 
          "pretext": "The deployment was created.",
          "image_url": "http://cache.lovethispic.com/uploaded_images/thumbs/195529-First-Day-Of-Deployment-Vs-The-Last-Month.jpg",
        })
      ]
    });
  }

  public whenBeforeDeploying(deployment:Deployment) {
    this.send({
      "text": `Started deploying ${deployment.config.appName}...`,
      "attachments":[
        this.createGitCommitAttachment(deployment.revInfo, {
          "color": "#999999", 
          "pretext": "The deployment is now started.",
          "image_url": "https://media.giphy.com/media/tXLpxypfSXvUc/giphy.gif",
        })
      ]
    });
  }

  public whenSuccess(deployment:Deployment) : Promise<any> {
    // Convert "deferred promise to ES6 Promise"
    var promise = this.send({
      "text": `Succeed!!!`,
      "attachments":[
        this.createGitCommitAttachment(deployment.revInfo, {
          "color": "#39aa56", 
          "pretext": `${deployment.config.appName} is successfully deployed.`,
          "image_url": "http://66.media.tumblr.com/tumblr_ltb3i7VfUf1qblmtj.gif",
        })
      ]
    });
    return new Promise<any>((resolve, reject) => {
      promise.then(resolve, reject);
    });
  }

  public whenFailure(deployment:Deployment) : Promise<any> {
    // Convert "deferred promise to ES6 Promise"
    var promise = this.send({
      "text": `Failed............................`,
      "attachments":[
        this.createGitCommitAttachment(deployment.revInfo, {
          "color": "#db4545", 
          "pretext": `The deployment of ${deployment.config.appName} was failed.`,
          "image_url": "https://media.giphy.com/media/a9xhxAxaqOfQs/giphy.gif",
        })
      ]
    });
    return new Promise<any>((resolve, reject) => {
      promise.then(resolve, reject);
    });
  }

  protected linkCommitHref(hash) {
    if (this.config.github) {
      return `<https://github.com/${this.config.github.org}/${this.config.github.repo}/commit/${hash}|${hash}>`;
    }
    return hash;
  }

  protected createGitCommitAttachment(revInfo: GitRevInfo, extra) {
    let latestCommit = revInfo.latestCommit();
    var attachment = {
      "fallback": "The attachement isn't supported.",
      "title": "Commit Message",
      "author_name": process.env['USER'],
      "text": latestCommit.message,
      "fields": [{
          "title": "Commit",
          "value": this.linkCommitHref(revInfo.latestCommit().hash),
          "short": true
        }, {
          "title": "Author",
          "value": latestCommit.author.name,
          "short": true
        }, {
          "title": "Date",
          "value": latestCommit.date,
          "short": true
        }, {
          "title": "Latest Tag",
          "value": revInfo.latestTag,
          "short": true,
        }],
      "mrkdwn_in": ["text","fields"],
    };
    return _.extend(attachment, extra || {});
  }

  /**
   * @return {deferred.promise}
   */
  send(msg) {
    return this.api.send(_.extend({
      "channel": this.config.channel,
      "username": this.config.username
    }, msg));
  }
}
