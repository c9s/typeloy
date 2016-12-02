const nodemiral = require('nodemiral');
const fs = require('fs');
const path = require('path');
const util = require('util');
const uuid = require('uuid');
const _ = require('underscore');

import {Config, AppConfig, SiteConfig} from "../config";

const DEPLOY_PREFIX = "/opt";

import {BaseTaskBuilder} from "./BaseTaskBuilder";

import {
  SCRIPT_DIR, TEMPLATES_DIR,
  Task,
  SetupTask,
  PkgUpdateTask,
  NodeJsSetupTask,
  MeteorEnvSetupTask,
  PhantomJsSetupTask,
  MongoSetupTask,
  MongoDumpTask,
  MongoRestoreTask,
  MongoGetTask,
  StudSetupTask,
  CertbotSetupTask,
  CertbotRenewTask,
  EnvVarsTask,
  BashEnvVarsTask,
  DeployTask,
  StartProcessTask,
  CopyBundleDeployTask,
  LogsTask,
  RestartTask,
  StopTask,
  StartTask,
  UploadTask
} from "../tasks";


class SetupTaskListBuilder {

  protected builder;

  constructor(builder) {
    this.builder = builder;
  }

  public definitions(config : Config) {
    const defs =  {
      "updatePackages": new PkgUpdateTask(config),
      "node": new NodeJsSetupTask(config),
      "phantom": new PhantomJsSetupTask(config),
      "environment": new MeteorEnvSetupTask(config),
      "mongo": new MongoSetupTask(config),
    }
    const siteConfig = this.builder.getSiteConfig();

    if (siteConfig.ssl) {
      defs["stud"] = new StudSetupTask(config, siteConfig.ssl);

      if (siteConfig.ssl.certbot) {
        const certbotConfig = siteConfig.ssl.certbot;
        if (!certbotConfig.domain) {
          throw new Error("certbot.domain is not defined");
        }
        if (!certbotConfig.email) {
          throw new Error("certbot.email is not defined");
        }
        defs["certbot"] = new CertbotSetupTask(config, certbotConfig.domain, certbotConfig.email);
        defs["certbotRenew"] = new CertbotRenewTask(config, certbotConfig.domain, certbotConfig.email);
      }
    }
    return defs;
  }

  public buildDefaultTasks(config : Config, definitions) {
    const tasks : Array<Task> = [];
    tasks.push(definitions.updatePackages);

    // Installation
    if (config.setup && config.setup.node) {
      tasks.push(definitions.node);
    }

    if (config.setup && config.setup.phantom) {
      tasks.push(definitions.phantom);
    }

    tasks.push(definitions.environment);

    if (config.setup.mongo) {
      tasks.push(definitions.mongo);
    }

    // Global ssl setup (work for all sites)
    if (config.ssl) {
      tasks.push(definitions.stud);
    }
    return tasks;
  }

  public build(config : Config, taskNames : Array<string>) : Array<Task> {
    const taskDefinitions = this.definitions(config);
    if (taskNames) {
      return _(taskNames).chain().map((taskName) => {
        return taskDefinitions[taskName];
      }).filter(x => x ? true : false).value();
    }
    return this.buildDefaultTasks(config, taskDefinitions);
  }
}

class DeployTaskList {
  static build(config : Config, bundlePath : string, env : any) : Array<Task> {
    return [
      new CopyBundleDeployTask(config, bundlePath),
      new BashEnvVarsTask(config, env),
      new EnvVarsTask(config, env),
      new StartProcessTask(config)
    ];
  }
}


export default class LinuxTaskBuilder extends BaseTaskBuilder {

  public getSiteConfig() : SiteConfig {
    return this.sessionGroup._siteConfig; 
  }

  public setup(config : Config, env, taskNames : Array<string>) {
    const builder = new SetupTaskListBuilder(this);
    return builder.build(config, taskNames);
  }

  public deploy(config : Config, bundlePath : string, env : any) : Array<Task> {
    return DeployTaskList.build(config, bundlePath, env);
  };

  public reconfig(config : Config, env) {
    return [
      new EnvVarsTask(config, env),
      new RestartTask(config)
    ];
  }

  public mongoGet(config : Config, env, file : string) {
    if (!config.mongo) {
      throw new Error("mongo settings is not configured.");
    }
    return [new MongoDumpTask(config), new MongoGetTask(config, file)];
  }

  public mongoRestore(config : Config, env, localFile : string) {
    const tasks : Array<Task> = [];
    if (!config.mongo) {
      throw new Error("mongo settings is not configured.");
    }
    // const tmpFile = `/opt/${config.app.name}/tmp/mongo-restore-${uuid.v4()}.gz`;
    const tmpFile = `/tmp/mongo-restore-${uuid.v4()}.gz`;
    return [
      new UploadTask(config, localFile, tmpFile, true),
      new StopTask(config),
      new MongoRestoreTask(config, tmpFile),
      new StartTask(config)
    ];
  }

  public mongoDump(config : Config, env) {
    if (!config.mongo) {
      throw new Error("mongo settings is not configured.");
    }
    return [new MongoDumpTask(config)];
  }

  public logs(config : Config, hostPrefix : string, logOptions : any) {
    return [new LogsTask(config, hostPrefix, logOptions)];
  }

  public restart(config : Config, env) {
    return [new RestartTask(config)];
  }

  public stop(config : Config, env) {
    return [new StopTask(config)];
  }

  public start(config : Config, env) {
    return [new StartTask(config)];
  }
}
