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
  AptGetUpdateTask,
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
      "updatePackages": new AptGetUpdateTask(config),
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

  protected taskList(title : string) {
    return nodemiral.taskList(title);
  }

  public setup(config : Config, taskNames : Array<string>) {
    const builder = new SetupTaskListBuilder(this);
    return builder.build(config, taskNames);
  }

  public deploy(config : Config, bundlePath : string, env : any) : Array<Task> {
    return DeployTaskList.build(config, bundlePath, env);
  };

  public reconfig(env, config : Config) {
    return [
      new EnvVarsTask(config, env),
      new RestartTask(config)
    ];
  }


  public mongoGet(config : Config, file : string) {
    if (config.mongo) {
      return [new MongoDumpTask(config),
              new MongoGetTask(config, file)];
    }
    throw new Error("mongo settings is not configured.");
  }

  public mongoRestore(config : Config, localFile : string) {
    const tasks : Array<Task> = [];
    if (config.mongo) {
      // const tmpFile = `/opt/${config.app.name}/tmp/mongo-restore-${uuid.v4()}.gz`;
      const tmpFile = `/tmp/mongo-restore-${uuid.v4()}.gz`;
      return [
        new UploadTask(config, localFile, tmpFile, true),
        new StopTask(config),
        new MongoRestoreTask(config, tmpFile),
        new StartTask(config)
      ];
    }
    throw new Error("mongo settings is not configured.");
  }

  public mongoDump(config : Config) {
    if (config.mongo) {
      return [new MongoDumpTask(config)];
    }
    throw new Error("mongo settings is not configured.");
  }

  public restart(config : Config) {
    return [new RestartTask(config)];
  }

  public logs(config : Config, hostPrefix : string, logOptions : any) {
    return [new LogsTask(config, hostPrefix, logOptions)];
  }

  public stop(config : Config) {
    return [new StopTask(config)];
  }

  public start(config : Config) {
    return [new StartTask(config)];
  }
}
