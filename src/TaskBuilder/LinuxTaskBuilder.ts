const nodemiral = require('nodemiral');
const fs = require('fs');
const path = require('path');
const util = require('util');
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
  StartTask
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
    const taskList = nodemiral.taskList('Setup Tasks');
    const taskDefinitions = this.definitions(config);
    if (taskNames) {
      const tasks = _(taskNames).chain().map((taskName) => {
        return taskDefinitions[taskName];
      }).filter(x => x ? true : false).value();
      tasks.forEach((t:Task) => t.build(taskList));
    } else {
      const tasks = this.buildDefaultTasks(config, taskDefinitions);
      tasks.forEach((t:Task) => t.build(taskList));
    }
    return taskList;
  }
}

class DeployTaskListBuilder {

  static build(config : Config, bundlePath : string, env : any) {
    const taskList = nodemiral.taskList("Deploy app '" + config.app.name + "'");
    const tasks : Array<Task> = [];
    tasks.push(new CopyBundleDeployTask(config, bundlePath));
    tasks.push(new BashEnvVarsTask(config, env));
    tasks.push(new EnvVarsTask(config, env));
    tasks.push(new StartProcessTask(config));
    tasks.forEach((t:Task) => {
      t.build(taskList);
    });
    return taskList;
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

  public deploy(config : Config, bundlePath : string, env : any) {
    return DeployTaskListBuilder.build(config, bundlePath, env);
  };

  public reconfig(env, config : Config) {
    const taskList = this.taskList("Reconfiguring Application (linux)");
    const tasks : Array<Task> = [];
    tasks.push(new EnvVarsTask(config, env));
    tasks.push(new RestartTask(config));
    tasks.forEach((t : Task) => {
      t.build(taskList);
    });
    return taskList;
  }


  public mongoGet(config : Config, file : string) {
    const tasks : Array<Task> = [];
    if (config.mongo) {
      tasks.push(new MongoGetTask(config, file));
    } else {
      console.error("mongo settings is not configured.");
    }
    const taskList = this.taskList("MongoDB Get (linux)");
    tasks.forEach((t : Task) => {
      t.build(taskList);
    });
    return taskList;
  }


  public mongoDump(config : Config) {
    const tasks : Array<Task> = [];
    if (config.mongo) {
      tasks.push(new MongoDumpTask(config));
    } else {
      console.error("mongo settings is not configured.");
    }
    const taskList = this.taskList("MongoDB Dump (linux)");
    tasks.forEach((t : Task) => {
      t.build(taskList);
    });
    return taskList;
  }

  public restart(config : Config) {
    const tasks : Array<Task> = [];
    tasks.push(new RestartTask(config));
    const taskList = this.taskList("Restarting Application (linux)");
    tasks.forEach((t : Task) => {
      t.build(taskList);
    });
    return taskList;
  }

  public logs(config : Config, hostPrefix : string, logOptions : any) {
    const tasks : Array<Task> = [];
    tasks.push(new LogsTask(config, hostPrefix, logOptions));
    const taskList = this.taskList("Getting Application Log (linux)");
    tasks.forEach((t : Task) => {
      t.build(taskList);
    });
    return taskList;
  }

  public stop(config : Config) {
    let taskList = this.taskList("Stopping Application (linux)");
    const tasks : Array<Task> = [];
    tasks.push(new StopTask(config));
    tasks.forEach((t : Task) => {
      t.build(taskList);
    });
    return taskList;
  }

  public start(config : Config) {
    let taskList = this.taskList("Starting Application (linux)");
    const tasks : Array<Task> = [];
    tasks.push(new StartTask(config));
    tasks.forEach((t : Task) => {
      t.build(taskList);
    });
    return taskList;
  }
}
