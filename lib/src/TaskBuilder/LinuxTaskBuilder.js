"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var nodemiral = require('nodemiral');
var fs = require('fs');
var path = require('path');
var util = require('util');
var DEPLOY_PREFIX = "/opt";
var BaseTaskBuilder_1 = require("./BaseTaskBuilder");
var tasks_1 = require("../tasks");
function translateBackupMongoConfigVars(config) {
    if (config.deploy.backupMongo) {
        var backupConfig = {};
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
var LinuxTaskBuilder = (function (_super) {
    __extends(LinuxTaskBuilder, _super);
    function LinuxTaskBuilder() {
        _super.apply(this, arguments);
    }
    LinuxTaskBuilder.prototype.taskList = function (title) {
        return nodemiral.taskList(title);
    };
    LinuxTaskBuilder.prototype.setup = function (config) {
        var taskList = this.taskList('Setup (linux)');
        var tasks = [];
        tasks.push(new tasks_1.AptGetUpdateTask(config));
        // Installation
        if (config.setup && config.setup.node) {
            tasks.push(new tasks_1.NodeJsSetupTask(config));
        }
        if (config.setup && config.setup.phantom) {
            tasks.push(new tasks_1.PhantomJsSetupTask(config));
        }
        tasks.push(new tasks_1.MeteorEnvSetupTask(config));
        if (config.setup.mongo) {
            tasks.push(new tasks_1.MongoSetupTask(config));
        }
        // XXX: Support ssl customization from SiteConfig
        if (config.ssl) {
            tasks.push(new tasks_1.SslSetupTask(config));
        }
        tasks.push(new tasks_1.UpstartSetupTask(config));
        tasks.push(new tasks_1.SystemdSetupTask(config));
        // build tasks into taskList
        tasks.forEach(function (t) {
            t.build(taskList);
        });
        return taskList;
    };
    LinuxTaskBuilder.prototype.deploy = function (config, bundlePath, env) {
        var taskList = this.taskList("Deploy app '" + config.app.name + "' (linux)");
        var copyBundle = new tasks_1.CopyBundleDeployTask(config, bundlePath);
        copyBundle.build(taskList);
        var bashEnvVars = new tasks_1.BashEnvVarsTask(config, env);
        bashEnvVars.build(taskList);
        var envVars = new tasks_1.EnvVarsTask(config, env);
        envVars.build(taskList);
        taskList.copy('Creating build.sh', {
            src: path.resolve(tasks_1.TEMPLATES_DIR, 'deploy.sh'),
            dest: DEPLOY_PREFIX + '/' + config.app.name + '/build.sh',
            vars: {
                deployPrefix: DEPLOY_PREFIX,
                deployCheckWaitTime: config.deploy.checkDelay || 10,
                backupMongo: translateBackupMongoConfigVars(config),
                appName: config.app.name
            }
        });
        var startProcess = new tasks_1.StartProcessTask(config);
        startProcess.build(taskList);
        return taskList;
    };
    ;
    LinuxTaskBuilder.prototype.reconfig = function (env, config) {
        var taskList = this.taskList("Updating configurations (linux)");
        taskList.copy('Setting up Environment Variables', {
            src: path.resolve(tasks_1.TEMPLATES_DIR, 'env.sh'),
            dest: DEPLOY_PREFIX + '/' + config.app.name + '/config/env.sh',
            vars: {
                env: env || {},
                appName: config.app.name
            }
        });
        if (this.sessionGroup._siteConfig.init === "systemd") {
            taskList.execute('Restarting app', {
                command: "sudo systemctl restart " + config.app.name + ".service"
            });
        }
        else {
            taskList.execute('Restarting app', {
                command: '(sudo stop ' + config.app.name + ' || :) && (sudo start ' + config.app.name + ')'
            });
        }
        return taskList;
    };
    LinuxTaskBuilder.prototype.restart = function (config) {
        var taskList = this.taskList("Restarting Application (linux)");
        if (this.sessionGroup._siteConfig.init === "systemd") {
            taskList.execute('Restarting app', {
                command: "sudo systemctl restart " + config.app.name + ".service"
            });
        }
        else {
            taskList.execute('Restarting app', {
                command: '(sudo stop ' + config.app.name + ' || :) && (sudo start ' + config.app.name + ')'
            });
        }
        return taskList;
    };
    LinuxTaskBuilder.prototype.stop = function (config) {
        var taskList = this.taskList("Stopping Application (linux)");
        if (this.sessionGroup._siteConfig.init === "systemd") {
            taskList.execute('Stopping app', {
                command: "sudo systemctl stop " + config.app.name + ".service"
            });
        }
        else {
            taskList.execute('Stopping app', { command: "(sudo stop " + config.app.name + ")" });
        }
        return taskList;
    };
    LinuxTaskBuilder.prototype.start = function (config) {
        var taskList = this.taskList("Starting Application (linux)");
        if (this.sessionGroup._siteConfig.init === "systemd") {
            taskList.execute('Stopping app', {
                command: 'sudo systemctl start ${config.app.name}.service'
            });
        }
        else {
            taskList.execute('Starting app', { command: "(sudo start " + config.app.name + ")" });
        }
        return taskList;
    };
    return LinuxTaskBuilder;
}(BaseTaskBuilder_1.BaseTaskBuilder));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LinuxTaskBuilder;
//# sourceMappingURL=LinuxTaskBuilder.js.map