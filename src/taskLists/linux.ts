var nodemiral = require('nodemiral');
var fs = require('fs');
var path = require('path');
var util = require('util');

var SCRIPT_DIR = path.resolve(__dirname, '../../scripts/linux');
var TEMPLATES_DIR = path.resolve(__dirname, '../../templates/linux');

const DEPLOY_PREFIX = "/opt";

export default class LinuxTasks {
  public static setup(config) {
    var taskList = nodemiral.taskList('Setup (linux)');

    // Installation
    if(config.setupNode) {
      taskList.executeScript('Installing Node.js: ' + config.nodeVersion, {
        script: path.resolve(SCRIPT_DIR, 'install-node.sh'),
        vars: {
          nodeVersion: config.nodeVersion
        }
      });
    }

    if(config.setupPhantom) {
      taskList.executeScript('Installing PhantomJS', {
        script: path.resolve(SCRIPT_DIR, 'install-phantomjs.sh')
      });
    }

    taskList.executeScript('Setting up environment variable script', {
      script: path.resolve(SCRIPT_DIR, 'setup-env.sh'),
      vars: {
        appName: config.appName
      }
    });

    if (config.setupMongo) {
      // If the user prefers some mongodb config, read the option
      taskList.copy('Copying MongoDB configuration', {
        src: path.resolve(TEMPLATES_DIR, 'mongodb.conf'),
        dest: '/etc/mongodb.conf'
      });
      taskList.executeScript('Installing MongoDB', {
        script: path.resolve(SCRIPT_DIR, 'install-mongodb.sh')
      });
    }

    if (config.ssl) {
      this.installStud(taskList);
      this.configureStud(taskList, config.ssl.pem, config.ssl.backendPort);
    }

    var upstartConfig = '/etc/init/' + config.appName + '.conf';
    taskList.copy('Configuring upstart: ' + upstartConfig, {
      src: path.resolve(TEMPLATES_DIR, 'meteor.conf'),
      dest: upstartConfig,
      vars: {
        appName: config.appName
      }
    });

    return taskList;
  }

  public static deploy(bundlePath, env, deployCheckWaitTime, appName, enableUploadProgressBar) {
    var taskList = nodemiral.taskList("Deploy app '" + appName + "' (linux)");

    const remoteBundlePath = DEPLOY_PREFIX + '/' + appName + '/tmp/bundle.tar.gz'
    console.log("Transfering " + bundlePath + ' => ' + remoteBundlePath);
    taskList.copy('Uploading bundle', {
      src: bundlePath,
      dest: DEPLOY_PREFIX + '/' + appName + '/tmp/bundle.tar.gz',
      progressBar: enableUploadProgressBar
    });

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
    taskList.copy('Setting up environment variables', {
      src: path.resolve(TEMPLATES_DIR, 'env.sh'),
      dest: DEPLOY_PREFIX + '/' + appName + '/config/env.sh',
      vars: {
        env: bashenv,
        appName: appName
      }
    });

    taskList.copy('Creating build.sh', {
      src: path.resolve(TEMPLATES_DIR, 'deploy.sh'),
      dest: DEPLOY_PREFIX + '/' + appName + '/build.sh',
      vars: {
        deployCheckWaitTime: deployCheckWaitTime || 10,
        appName: appName
      }
    });

    // deploying
    taskList.executeScript('Invoking deployment process', {
      script: path.resolve(TEMPLATES_DIR, 'deploy.sh'),
      vars: {
        deployCheckWaitTime: deployCheckWaitTime || 10,
        appName: appName
      }
    });

    return taskList;
  };

  public static reconfig(env, appName) {
    var taskList = nodemiral.taskList("Updating configurations (linux)");

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

  public static restart(appName) {
    var taskList = nodemiral.taskList("Restarting Application (linux)");

    //restarting
    taskList.execute('Restarting app', {
      command: '(sudo stop ' + appName + ' || :) && (sudo start ' + appName + ')'
    });

    return taskList;
  }

  public static stop(appName) {
    var taskList = nodemiral.taskList("Stopping Application (linux)");

    //stopping
    taskList.execute('Stopping app', {
      command: '(sudo stop ' + appName + ')'
    });

    return taskList;
  }

  public static start(appName) {
    var taskList = nodemiral.taskList("Starting Application (linux)");

    //starting
    taskList.execute('Starting app', {
      command: '(sudo start ' + appName + ')'
    });

    return taskList;
  }

  public static installStud(taskList) {
    taskList.executeScript('Installing Stud', {
      script: path.resolve(SCRIPT_DIR, 'install-stud.sh')
    });
  }

  public static configureStud(taskList, pemFilePath, port) {
    var backend = {host: '127.0.0.1', port: port};

    taskList.copy('Configuring Stud for Upstart', {
      src: path.resolve(TEMPLATES_DIR, 'stud.init.conf'),
      dest: '/etc/init/stud.conf'
    });

    taskList.copy('Configuring SSL', {
      src: pemFilePath,
      dest: DEPLOY_PREFIX + '/stud/ssl.pem'
    });


    taskList.copy('Configuring Stud', {
      src: path.resolve(TEMPLATES_DIR, 'stud.conf'),
      dest: DEPLOY_PREFIX + '/stud/stud.conf',
      vars: {
        backend: util.format('[%s]:%d', backend.host, backend.port)
      }
    });

    taskList.execute('Verifying SSL Configurations (ssl.pem)', {
      command: `stud --test --config=${DEPLOY_PREFIX}/stud/stud.conf`
    });

    //restart stud
    taskList.execute('Starting Stud', {
      command: '(sudo stop stud || :) && (sudo start stud || :)'
    });
  }
}

