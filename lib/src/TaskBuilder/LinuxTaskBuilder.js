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
var PhantomJsSetupTask = (function (_super) {
    __extends(PhantomJsSetupTask, _super);
    function PhantomJsSetupTask() {
        _super.apply(this, arguments);
    }
    PhantomJsSetupTask.prototype.describe = function () {
        return 'Installing PhantomJS';
    };
    PhantomJsSetupTask.prototype.build = function (taskList) {
        taskList.executeScript(this.describe(), {
            script: path.resolve(tasks_1.SCRIPT_DIR, 'install-phantomjs.sh')
        });
    };
    return PhantomJsSetupTask;
}(tasks_1.SetupTask));
var MongoSetupTask = (function (_super) {
    __extends(MongoSetupTask, _super);
    function MongoSetupTask() {
        _super.apply(this, arguments);
    }
    MongoSetupTask.prototype.describe = function () {
        return 'Copying MongoDB configuration';
    };
    MongoSetupTask.prototype.build = function (taskList) {
        // If the user prefers some mongodb config, read the option
        taskList.copy(this.describe(), {
            src: path.resolve(tasks_1.TEMPLATES_DIR, 'mongodb.conf'),
            dest: '/etc/mongodb.conf'
        });
        taskList.executeScript('Installing MongoDB', {
            script: path.resolve(tasks_1.SCRIPT_DIR, 'install-mongodb.sh')
        });
    };
    return MongoSetupTask;
}(tasks_1.SetupTask));
var SslSetupTask = (function (_super) {
    __extends(SslSetupTask, _super);
    function SslSetupTask() {
        _super.apply(this, arguments);
    }
    SslSetupTask.prototype.describe = function () {
        return 'Setting up ssl';
    };
    SslSetupTask.prototype.build = function (taskList) {
        this.installStud(taskList);
        this.configureStud(taskList, this.config.ssl.pem, this.config.ssl.backendPort);
    };
    SslSetupTask.prototype.installStud = function (taskList) {
        taskList.executeScript('Installing Stud', {
            script: path.resolve(tasks_1.SCRIPT_DIR, 'install-stud.sh')
        });
    };
    SslSetupTask.prototype.configureStud = function (taskList, pemFilePath, port) {
        var backend = { host: '127.0.0.1', port: port };
        taskList.copy('Configuring Stud for Upstart', {
            src: path.resolve(tasks_1.TEMPLATES_DIR, 'stud.init.conf'),
            dest: '/etc/init/stud.conf'
        });
        taskList.copy('Configuring SSL', {
            src: pemFilePath,
            dest: this.deployPrefix + '/stud/ssl.pem'
        });
        taskList.copy('Configuring Stud', {
            src: path.resolve(tasks_1.TEMPLATES_DIR, 'stud.conf'),
            dest: this.deployPrefix + '/stud/stud.conf',
            vars: {
                backend: util.format('[%s]:%d', backend.host, backend.port)
            }
        });
        taskList.execute('Verifying SSL Configurations (ssl.pem)', {
            'command': "stud --test --config=" + this.deployPrefix + "/stud/stud.conf"
        });
        //restart stud
        taskList.execute('Starting Stud', {
            'command': '(sudo stop stud || :) && (sudo start stud || :)'
        });
    };
    return SslSetupTask;
}(tasks_1.SetupTask));
var SystemdSetupTask = (function (_super) {
    __extends(SystemdSetupTask, _super);
    function SystemdSetupTask() {
        _super.apply(this, arguments);
    }
    SystemdSetupTask.prototype.describe = function () {
        return 'Configuring systemd: ' + this.getConfigPath();
    };
    SystemdSetupTask.prototype.getConfigPath = function () {
        return "/lib/systemd/system/" + this.getAppName() + ".service";
    };
    SystemdSetupTask.prototype.build = function (taskList) {
        taskList.copy(this.describe(), {
            'src': path.resolve(tasks_1.TEMPLATES_DIR, 'meteor/systemd.conf'),
            'dest': this.getConfigPath(),
            'vars': this.extendArgs({}),
        });
    };
    return SystemdSetupTask;
}(tasks_1.SetupTask));
var UpstartSetupTask = (function (_super) {
    __extends(UpstartSetupTask, _super);
    function UpstartSetupTask() {
        _super.apply(this, arguments);
    }
    UpstartSetupTask.prototype.describe = function () {
        return 'Configuring upstart: ' + this.getUpstartConfigPath();
    };
    UpstartSetupTask.prototype.getUpstartConfigPath = function () {
        return '/etc/init/' + this.config.app.name + '.conf';
    };
    UpstartSetupTask.prototype.getAppName = function () {
        return this.config.app.name;
    };
    UpstartSetupTask.prototype.build = function (taskList) {
        var upstartConfig = this.getUpstartConfigPath();
        taskList.copy(this.describe(), {
            src: path.resolve(tasks_1.TEMPLATES_DIR, 'meteor/upstart.conf'),
            dest: upstartConfig,
            vars: {
                deployPrefix: this.deployPrefix,
                appName: this.getAppName()
            }
        });
    };
    return UpstartSetupTask;
}(tasks_1.SetupTask));
/**
 * EnvVars with export statement
 */
var EnvVarsTask = (function (_super) {
    __extends(EnvVarsTask, _super);
    function EnvVarsTask(config, env) {
        _super.call(this, config);
        this.env = env;
    }
    EnvVarsTask.prototype.describe = function () {
        return 'Setting up environment variable file';
    };
    EnvVarsTask.prototype.buildEnvDict = function () {
        var bashenv = {};
        for (var key in this.env) {
            var val = this.env[key];
            if (typeof val === "object") {
                // Do proper escape
                bashenv[key] = JSON.stringify(val).replace(/[\""]/g, '\\"');
            }
            else if (typeof val === "string") {
                bashenv[key] = val.replace(/[\""]/g, '\\"');
            }
            else {
                bashenv[key] = val;
            }
        }
        return bashenv;
    };
    EnvVarsTask.prototype.build = function (taskList) {
        var bashenv = this.buildEnvDict();
        taskList.copy(this.describe(), {
            'src': path.resolve(tasks_1.TEMPLATES_DIR, 'env-vars'),
            'dest': this.appRoot + '/config/env-vars',
            'vars': this.extendArgs({ 'env': bashenv }),
        });
    };
    return EnvVarsTask;
}(tasks_1.Task));
/**
 * Bash EnvVars with export statement
 */
var BashEnvVarsTask = (function (_super) {
    __extends(BashEnvVarsTask, _super);
    function BashEnvVarsTask() {
        _super.apply(this, arguments);
    }
    BashEnvVarsTask.prototype.describe = function () {
        return 'Setting up environment variable file for bash';
    };
    BashEnvVarsTask.prototype.build = function (taskList) {
        var bashenv = this.buildEnvDict();
        taskList.copy(this.describe(), {
            'src': path.resolve(tasks_1.TEMPLATES_DIR, 'env.sh'),
            'dest': this.appRoot + '/config/env.sh',
            'vars': this.extendArgs({ 'env': bashenv }),
        });
    };
    return BashEnvVarsTask;
}(EnvVarsTask));
var DeployTask = (function (_super) {
    __extends(DeployTask, _super);
    function DeployTask() {
        _super.apply(this, arguments);
    }
    return DeployTask;
}(tasks_1.Task));
var StartProcessTask = (function (_super) {
    __extends(StartProcessTask, _super);
    function StartProcessTask(config) {
        _super.call(this, config);
    }
    StartProcessTask.prototype.describe = function () {
        return 'Invoking deployment process';
    };
    StartProcessTask.prototype.build = function (taskList) {
        var appName = this.config.app.name;
        taskList.executeScript(this.describe(), {
            'script': path.resolve(tasks_1.TEMPLATES_DIR, 'deploy.sh'),
            'vars': this.extendArgs({
                'backupMongo': translateBackupMongoConfigVars(this.config),
                'deployCheckWaitTime': this.config.deploy.checkDelay || 10
            })
        });
    };
    return StartProcessTask;
}(DeployTask));
var CopyBundleDeployTask = (function (_super) {
    __extends(CopyBundleDeployTask, _super);
    function CopyBundleDeployTask(config, bundlePath) {
        _super.call(this, config);
        this.bundlePath = bundlePath;
    }
    CopyBundleDeployTask.prototype.describe = function () {
        return 'Uploading bundle: ' + this.bundlePath;
    };
    CopyBundleDeployTask.prototype.build = function (taskList) {
        var appName = this.config.app.name;
        var remoteBundlePath = this.deployPrefix + '/' + appName + '/tmp/bundle.tar.gz';
        console.log("Transfering " + this.bundlePath + ' => ' + remoteBundlePath);
        taskList.copy(this.describe(), {
            src: this.bundlePath,
            dest: this.deployPrefix + '/' + appName + '/tmp/bundle.tar.gz',
            progressBar: this.config.enableUploadProgressBar
        });
    };
    return CopyBundleDeployTask;
}(DeployTask));
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
            tasks.push(new PhantomJsSetupTask(config));
        }
        tasks.push(new tasks_1.MeteorEnvSetupTask(config));
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
        tasks.forEach(function (t) {
            t.build(taskList);
        });
        return taskList;
    };
    LinuxTaskBuilder.prototype.deploy = function (config, bundlePath, env) {
        var taskList = this.taskList("Deploy app '" + config.app.name + "' (linux)");
        var copyBundle = new CopyBundleDeployTask(config, bundlePath);
        copyBundle.build(taskList);
        var bashEnvVars = new BashEnvVarsTask(config, env);
        bashEnvVars.build(taskList);
        var envVars = new EnvVarsTask(config, env);
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
        var startProcess = new StartProcessTask(config);
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