const nodemiral = require('nodemiral');
const fs = require('fs');
const path = require('path');
const util = require('util');

import {Config, AppConfig} from "../config";

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
  SslSetupTask,
  SystemdSetupTask,
  UpstartSetupTask,
  EnvVarsTask,
  BashEnvVarsTask,
  DeployTask,
  StartProcessTask
} from "../tasks";

function translateBackupMongoConfigVars(config : Config) : any {
  if (config.deploy.backupMongo) {
    let backupConfig : any = {};
    if (typeof config.deploy.backupMongo === "object") {
      backupConfig.host = config.deploy.backupMongo.host || 'localhost';
      backupConfig.port = config.deploy.backupMongo.port || 27017;
      backupConfig.db = config.deploy.backupMongo.db || config.app.name;
    }
    return backupConfig;
  }
  return null;
}
// 'backupMongo': translateBackupMongoConfigVars(this.config),



class CopyBundleDeployTask extends DeployTask {

  protected bundlePath : string;

  constructor(config : Config, bundlePath:string) {
    super(config);
    this.bundlePath = bundlePath;
  }

  public describe() : string {
    return 'Uploading bundle: ' + this.bundlePath;
  }

  public build(taskList) {
    const appName = this.config.app.name;
    const remoteBundlePath = this.deployPrefix + '/' + appName + '/tmp/bundle.tar.gz'
    console.log("Transfering " + this.bundlePath + ' => ' + remoteBundlePath);
    taskList.copy(this.describe(), {
      src: this.bundlePath,
      dest: this.deployPrefix + '/' + appName + '/tmp/bundle.tar.gz',
      progressBar: this.config.enableUploadProgressBar
    });
  }
}

export default class LinuxTaskBuilder extends BaseTaskBuilder {

  protected taskList(title : string) {
    return nodemiral.taskList(title);
  }

  public setup(config : Config) {
    const taskList = this.taskList('Setup (linux)');

    let tasks : Array<Task> = [];
    tasks.push(new AptGetUpdateTask(config));

    // Installation
    if (config.setup && config.setup.node) {
      tasks.push(new NodeJsSetupTask(config));
    }

    if (config.setup && config.setup.phantom) {
      tasks.push(new PhantomJsSetupTask(config));
    }

    tasks.push(new MeteorEnvSetupTask(config));

    if (config.setup.mongo) {
      tasks.push(new MongoSetupTask(config));
    }

    // XXX: Support ssl customization from SiteConfig
    if (config.ssl) {
      tasks.push(new SslSetupTask(config));
    }

    tasks.push(new UpstartSetupTask(config));
    tasks.push(new SystemdSetupTask(config));

    // build tasks into taskList
    tasks.forEach((t:Task) => {
      t.build(taskList);
    });
    return taskList;
  }

  public deploy(config : Config, bundlePath : string, env) {
    let taskList = this.taskList("Deploy app '" + config.app.name + "' (linux)");

    let copyBundle = new CopyBundleDeployTask(config, bundlePath);
    copyBundle.build(taskList);

    let bashEnvVars = new BashEnvVarsTask(config, env);
    bashEnvVars.build(taskList);

    let envVars = new EnvVarsTask(config, env);
    envVars.build(taskList);

    taskList.copy('Creating build.sh', {
      src: path.resolve(TEMPLATES_DIR, 'deploy.sh'),
      dest: DEPLOY_PREFIX + '/' + config.app.name + '/build.sh',
      vars: {
        deployPrefix: DEPLOY_PREFIX,
        deployCheckWaitTime: config.deploy.checkDelay || 10,
        backupMongo: translateBackupMongoConfigVars(config),
        appName: config.app.name
      }
    });

    let startProcess = new StartProcessTask(config);
    startProcess.build(taskList);

    return taskList;
  };

  public reconfig(env, config : Config) {
    var taskList = this.taskList("Updating configurations (linux)");
    taskList.copy('Setting up Environment Variables', {
      src: path.resolve(TEMPLATES_DIR, 'env.sh'),
      dest: DEPLOY_PREFIX + '/' + config.app.name + '/config/env.sh',
      vars: {
        env: env || {},
        appName: config.app.name
      }
    });

    if (this.sessionGroup._siteConfig.init === "systemd") {
      taskList.execute('Restarting app', {
        command: `sudo systemctl restart ${config.app.name}.service`
      });
    } else {
      taskList.execute('Restarting app', {
        command: '(sudo stop ' + config.app.name + ' || :) && (sudo start ' + config.app.name + ')'
      });
    }
    return taskList;
  }

  public restart(config : Config) {
    let taskList = this.taskList("Restarting Application (linux)");
    if (this.sessionGroup._siteConfig.init === "systemd") {
      taskList.execute('Restarting app', {
        command: `sudo systemctl restart ${config.app.name}.service`
      });
    } else {
      taskList.execute('Restarting app', {
        command: '(sudo stop ' + config.app.name + ' || :) && (sudo start ' + config.app.name + ')'
      });
    }
    return taskList;
  }

  public stop(config : Config) {
    let taskList = this.taskList("Stopping Application (linux)");
    if (this.sessionGroup._siteConfig.init === "systemd") {
      taskList.execute('Stopping app', {
        command: `sudo systemctl stop ${config.app.name}.service`
      });
    } else {
      taskList.execute('Stopping app', { command: `(sudo stop ${config.app.name})` });
    }
    return taskList;
  }

  public start(config : Config) {
    let taskList = this.taskList("Starting Application (linux)");
    if (this.sessionGroup._siteConfig.init === "systemd") {
      taskList.execute('Stopping app', {
        command: 'sudo systemctl start ${config.app.name}.service'
      });
    } else {
      taskList.execute('Starting app', { command: `(sudo start ${config.app.name})` });
    }
    return taskList;
  }
}
