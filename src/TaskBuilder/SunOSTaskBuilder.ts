var nodemiral = require('nodemiral');
var fs = require('fs');
var path = require('path');

var SCRIPT_DIR = path.resolve(__dirname, '../../../scripts/sunos');
var TEMPLATES_DIR = path.resolve(__dirname, '../../../templates/sunos');

import {Config} from "../Config";

import {TaskBuilder} from "./BaseTaskBuilder";

function reconfig(taskList, appName, env) {
  taskList.copy('Setting up environment variables', {
    src: path.resolve(TEMPLATES_DIR, 'env.sh'),
    dest: '/opt/' + appName + '/config/env.sh',
    vars: {
      env: env || {},
      appName: appName
    }
  });
}

export default class SunosTasks implements TaskBuilder {

  public setup(config:Config) {
    let installMongo = config.setup.mongo;
    let setupNode = config.setup.node;
    let nodeVersion = config.setup.node;
    let setupPhantom = config.setup.phantom;
    let appName = config.app.name;
    
    // installMongo, setupNode, nodeVersion, setupPhantom, appName) {
    var taskList = nodemiral.taskList('Setup (sunos)');

    // Installation
    if (setupNode) {
      taskList.executeScript('Installing Node.js', {
        script: path.resolve(SCRIPT_DIR, 'install-node.sh'),
        vars: {
          nodeVersion: nodeVersion
        }
      });
    }

    taskList.executeScript('Setting up Environment', {
      script: path.resolve(SCRIPT_DIR, 'setup-env.sh'),
      vars: {
        appName: appName
      }
    });

    taskList.copy('Setting up Running Script', {
      src: path.resolve(TEMPLATES_DIR, 'run.sh'),
      dest: '/opt/' + appName + '/run.sh',
      vars: {
        appName: appName
      }
    });

    var serviceManifestDest = '/opt/' + appName + '/config/service-manifest.xml';
    taskList.copy('Copying SMF Manifest', {
      src: path.resolve(TEMPLATES_DIR, 'service-manifest.xml'),
      dest: serviceManifestDest,
      vars: {
        appName: appName
      }
    });

    taskList.execute('Configuring SMF Manifest', {
      command: 'sudo svccfg import ' + serviceManifestDest
    });

    return taskList;
  }

  public deploy(bundlePath, env, deployCheckWaitTime, appName) {
    var taskList = nodemiral.taskList("Deploy app '" + appName + "' (sunos)");

    taskList.copy('Uploading bundle', {
      src: bundlePath,
      dest: '/opt/' + appName + '/tmp/bundle.tar.gz'
    });

    reconfig(taskList, appName, env);

    // deploying
    taskList.executeScript('Invoking deployment process', {
      script: path.resolve(TEMPLATES_DIR, 'deploy.sh'),
      vars: {
        deployCheckWaitTime: deployCheckWaitTime || 10,
        appName: appName
      }
    });

    return taskList;
  }

  public reconfig(env, appName) {
    var taskList = nodemiral.taskList("Updating configurations (sunos)");

    reconfig(taskList, appName, env);

    //deploying
    taskList.execute('Restarting app', {
      command: '(sudo svcadm disable ' + appName + ' || :) && (sudo svcadm enable ' + appName + ')'
    });

    return taskList;
  };

  public restart(appName) {
    var taskList = nodemiral.taskList("Restarting Application (sunos)");

    //restarting
    taskList.execute('Restarting app', {
      command: '(sudo svcadm disable ' + appName + ' || :) && (sudo svcadm enable ' + appName + ')'
    });

    return taskList;
  }

  public stop(appName) {
    var taskList = nodemiral.taskList("Stopping Application (sunos)");

    //stopping
    taskList.execute('Stopping app', {
      command: '(sudo svcadm disable ' + appName + ')'
    });

    return taskList;
  }

  public start(appName) {
    var taskList = nodemiral.taskList("Starting Application (sunos)");

    reconfig(taskList, appName, process.env);

    //starting
    taskList.execute('Starting app', {
      command: '(sudo svcadm enable ' + appName + ')'
    });

    return taskList;
  }
}


