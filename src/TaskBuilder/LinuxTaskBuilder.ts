var nodemiral = require('nodemiral');
var fs = require('fs');
var path = require('path');
var util = require('util');

import {Config, AppConfig} from "../config";

var SCRIPT_DIR = path.resolve(__dirname, '../../../scripts/linux');
var TEMPLATES_DIR = path.resolve(__dirname, '../../../templates/linux');

const DEPLOY_PREFIX = "/opt";

import {TaskBuilder} from "./BaseTaskBuilder";

import {Task} from "./Task";

abstract class SetupTask extends Task {

}

class AptGetUpdateTask extends Task {

  public describe() : string {
    return 'Updating package index';
  }

  public build(taskList) {
    taskList.executeScript(this.describe(), {
      script: path.resolve(SCRIPT_DIR, 'apt-update.sh'), vars: { }
    });
  }
}


class NodeJsSetupTask extends SetupTask {

  public describe() : string {
    return 'Installing Node.js: ' + this.config.setup.nodeVersion;
  }

  public build(taskList) {
    taskList.executeScript(this.describe(), {
      script: path.resolve(SCRIPT_DIR, 'install-node.sh'),
      vars: {
        nodeVersion: this.config.setup.nodeVersion,
        deployPrefix: this.deployPrefix
      }
    });
  }

}

class MeteorEnvSetupTask extends SetupTask {
  public describe() : string {
    return 'Setting up environment for meteor application';
  }

  public build(taskList) {
    taskList.executeScript(this.describe(), {
      script: path.resolve(SCRIPT_DIR, 'setup-env.sh'),
      vars: {
        appName: this.config.app.name,
        deployPrefix: this.deployPrefix
      }
    });
  }

}

class PhantomJsSetupTask extends SetupTask {

  public describe() : string {
    return 'Installing PhantomJS';
  }
  
  public build(taskList) {
    taskList.executeScript(this.describe(), {
      script: path.resolve(SCRIPT_DIR, 'install-phantomjs.sh')
    });
  }

}

class MongoSetupTask extends SetupTask {

  public describe() : string {
    return 'Copying MongoDB configuration';
  }

  public build(taskList) {
    // If the user prefers some mongodb config, read the option
    taskList.copy(this.describe(), {
      src: path.resolve(TEMPLATES_DIR, 'mongodb.conf'),
      dest: '/etc/mongodb.conf'
    });
    taskList.executeScript('Installing MongoDB', {
      script: path.resolve(SCRIPT_DIR, 'install-mongodb.sh')
    });
  }

}

class SslSetupTask extends SetupTask {

  public describe() : string {
    return 'Setting up ssl';
  }

  public build(taskList) {
    this.installStud(taskList);
    this.configureStud(taskList, this.config.ssl.pem, this.config.ssl.backendPort);
  }

  public installStud(taskList) {
    taskList.executeScript('Installing Stud', {
      script: path.resolve(SCRIPT_DIR, 'install-stud.sh')
    });
  }

  public configureStud(taskList, pemFilePath, port) {
    var backend = {host: '127.0.0.1', port: port};

    taskList.copy('Configuring Stud for Upstart', {
      src: path.resolve(TEMPLATES_DIR, 'stud.init.conf'),
      dest: '/etc/init/stud.conf'
    });

    taskList.copy('Configuring SSL', {
      src: pemFilePath,
      dest: this.deployPrefix + '/stud/ssl.pem'
    });


    taskList.copy('Configuring Stud', {
      src: path.resolve(TEMPLATES_DIR, 'stud.conf'),
      dest: this.deployPrefix + '/stud/stud.conf',
      vars: {
        backend: util.format('[%s]:%d', backend.host, backend.port)
      }
    });

    taskList.execute('Verifying SSL Configurations (ssl.pem)', {
      'command': `stud --test --config=${this.deployPrefix}/stud/stud.conf`
    });

    //restart stud
    taskList.execute('Starting Stud', {
      'command': '(sudo stop stud || :) && (sudo start stud || :)'
    });
  }
}


/*
class StartScriptTask extends SetupTask {

  public describe() : string {
    return 'Creating start script entry';
  }

  protected getAppName() : string {
    return this.config.app.name;
  }

  public build(taskList) {
    taskList.copy(this.describe(), {
      src: path.resolve(TEMPLATES_DIR, 'meteor/systemd.conf'),
      dest: this.getAppRoot(),
      vars: {
        deployPrefix: this.deployPrefix,
        appName: this.getAppName()
      }
    });
  }
}
*/


class SystemdSetupTask extends SetupTask {

  public describe() : string {
    return 'Configuring systemd: ' + this.getConfigPath();
  }

  protected getConfigPath() : string {
    return '/lib/systemd/system/meteor.service';
  }

  protected getAppName() : string {
    return this.config.app.name;
  }

  public build(taskList) {
    taskList.copy(this.describe(), {
      src: path.resolve(TEMPLATES_DIR, 'meteor/systemd.conf'),
      dest: this.getConfigPath(),
      vars: {
        deployPrefix: this.deployPrefix,
        appName: this.getAppName()
      }
    });
  }
}


class UpstartSetupTask extends SetupTask {

  public describe() : string {
    return 'Configuring upstart: ' + this.getUpstartConfigPath();
  }

  protected getUpstartConfigPath() : string {
    return '/etc/init/' + this.config.app.name + '.conf';
  }

  protected getAppName() : string {
    return (<AppConfig>this.config.app).name;
  }

  public build(taskList) {
    var upstartConfig : string = this.getUpstartConfigPath();
    taskList.copy(this.describe(), {
      src: path.resolve(TEMPLATES_DIR, 'meteor/upstart.conf'),
      dest: upstartConfig,
      vars: {
        deployPrefix: this.deployPrefix,
        appName: this.getAppName()
      }
    });
  }
}



/**
 * EnvVars with export statement
 */
class EnvVarsTask extends Task {

  protected env;

  constructor(config : Config, env) {
    super(config);
    this.env = env;
  }

  public describe() : string {
    return 'Setting up environment variable file';
  }


  protected buildEnvDict() {
    let bashenv = {};
    for (let key in this.env) {
      let val = this.env[key];
      if (typeof val === "object") {
        // Do proper escape
        bashenv[key] = JSON.stringify(val).replace(/[\""]/g, '\\"')
      } else if (typeof val === "string") {
        bashenv[key] = val.replace(/[\""]/g, '\\"');
      } else {
        bashenv[key] = val;
      }
    }
    return bashenv;
  }

  public build(taskList) {
    let bashenv = this.buildEnvDict();
    taskList.copy(this.describe(), {
      'src': path.resolve(TEMPLATES_DIR, 'env-vars'),
      'dest': this.deployPrefix + '/' + this.config.app.name + '/config/env-vars',
      'vars': {
        'deployPrefix': this.deployPrefix,
        'env': bashenv,
        'appName': this.config.app.name
      }
    });
  }
}



/**
 * Bash EnvVars with export statement
 */
class BashEnvVarsTask extends EnvVarsTask {

  public describe() : string {
    return 'Setting up environment variable file for bash';
  }

  public build(taskList) {
    let bashenv = this.buildEnvDict();
    taskList.copy(this.describe(), {
      'src': path.resolve(TEMPLATES_DIR, 'env.sh'),
      'dest': this.deployPrefix + '/' + this.config.app.name + '/config/env.sh',
      'vars': {
        'deployPrefix': this.deployPrefix,
        'env': bashenv,
        'appName': this.config.app.name
      }
    });
  }
}


abstract class DeployTask extends Task { }

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

export default class LinuxTaskBuilder implements TaskBuilder {

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

    if (config.ssl) {
      tasks.push(new SslSetupTask(config));
    }
    tasks.push(new UpstartSetupTask(config));

    // build tasks into taskList
    tasks.forEach((t:Task) => {
      t.build(taskList);
    });
    return taskList;
  }

  public deploy(config:Config, bundlePath:string, env, checkDelay, appName : string) {
    var taskList = this.taskList("Deploy app '" + appName + "' (linux)");


    let copyBundle = new CopyBundleDeployTask(config, bundlePath);
    copyBundle.build(taskList);

    var bashenv = {};
    for (var key in env) {
      var val = env[key];
      if (typeof val === "object") {
        // Do proper escape
        bashenv[key] = JSON.stringify(val).replace(/[\""]/g, '\\"')
      } else if (typeof val === "string") {
        bashenv[key] = val.replace(/[\""]/g, '\\"');
      } else {
        bashenv[key] = val;
      }
    }

    let bashEnvVars = new BashEnvVarsTask(config, env);
    bashEnvVars.build(taskList);

    taskList.copy('Creating build.sh', {
      src: path.resolve(TEMPLATES_DIR, 'deploy.sh'),
      dest: DEPLOY_PREFIX + '/' + appName + '/build.sh',
      vars: {
        deployPrefix: DEPLOY_PREFIX,
        deployCheckWaitTime: checkDelay || 10,
        appName: appName
      }
    });

    // deploying
    taskList.executeScript('Invoking deployment process', {
      script: path.resolve(TEMPLATES_DIR, 'deploy.sh'),
      vars: {
        deployPrefix: DEPLOY_PREFIX,
        deployCheckWaitTime: checkDelay || 10,
        appName: appName
      }
    });

    return taskList;
  };

  public reconfig(env, appName) {
    var taskList = this.taskList("Updating configurations (linux)");

    taskList.copy('Setting up Environment Variables', {
      src: path.resolve(TEMPLATES_DIR, 'env.sh'),
      dest: DEPLOY_PREFIX + '/' + appName + '/config/env.sh',
      vars: {
        env: env || {},
        appName: appName
      }
    });

    //restarting
    taskList.execute('Restarting app', {
      command: '(sudo stop ' + appName + ' || :) && (sudo start ' + appName + ')'
    });

    return taskList;
  }

  public restart(appName) {
    var taskList = this.taskList("Restarting Application (linux)");

    //restarting
    taskList.execute('Restarting app', {
      command: '(sudo stop ' + appName + ' || :) && (sudo start ' + appName + ')'
    });

    return taskList;
  }

  public stop(appName) {
    var taskList = this.taskList("Stopping Application (linux)");

    //stopping
    taskList.execute('Stopping app', {
      command: '(sudo stop ' + appName + ')'
    });

    return taskList;
  }

  public start(appName) {
    var taskList = this.taskList("Starting Application (linux)");

    //starting
    taskList.execute('Starting app', {
      command: '(sudo start ' + appName + ')'
    });

    return taskList;
  }

}

