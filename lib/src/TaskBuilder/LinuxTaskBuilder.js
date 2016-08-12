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
var SCRIPT_DIR = path.resolve(__dirname, '../../../scripts/linux');
var TEMPLATES_DIR = path.resolve(__dirname, '../../../templates/linux');
var DEPLOY_PREFIX = "/opt";
var Task_1 = require("./Task");
var SetupTask = (function (_super) {
    __extends(SetupTask, _super);
    function SetupTask() {
        _super.apply(this, arguments);
    }
    return SetupTask;
}(Task_1.Task));
var AptGetUpdateTask = (function (_super) {
    __extends(AptGetUpdateTask, _super);
    function AptGetUpdateTask() {
        _super.apply(this, arguments);
    }
    AptGetUpdateTask.prototype.describe = function () {
        return 'Updating package index';
    };
    AptGetUpdateTask.prototype.build = function (taskList) {
        taskList.executeScript(this.describe(), {
            script: path.resolve(SCRIPT_DIR, 'apt-update.sh'), vars: {}
        });
    };
    return AptGetUpdateTask;
}(Task_1.Task));
var NodeJsSetupTask = (function (_super) {
    __extends(NodeJsSetupTask, _super);
    function NodeJsSetupTask() {
        _super.apply(this, arguments);
    }
    NodeJsSetupTask.prototype.describe = function () {
        return 'Installing Node.js: ' + this.getNodeVersion();
    };
    NodeJsSetupTask.prototype.getNodeVersion = function () {
        return this.config.setup.nodeVersion || '0.10.44';
    };
    NodeJsSetupTask.prototype.build = function (taskList) {
        taskList.executeScript(this.describe(), {
            script: path.resolve(SCRIPT_DIR, 'install-node.sh'),
            vars: {
                nodeVersion: this.getNodeVersion(),
                deployPrefix: this.deployPrefix
            }
        });
    };
    return NodeJsSetupTask;
}(SetupTask));
var MeteorEnvSetupTask = (function (_super) {
    __extends(MeteorEnvSetupTask, _super);
    function MeteorEnvSetupTask() {
        _super.apply(this, arguments);
    }
    MeteorEnvSetupTask.prototype.describe = function () {
        return 'Setting up environment for meteor application';
    };
    MeteorEnvSetupTask.prototype.build = function (taskList) {
        taskList.executeScript(this.describe(), {
            script: path.resolve(SCRIPT_DIR, 'setup-env.sh'),
            vars: {
                appName: this.config.app.name,
                deployPrefix: this.deployPrefix
            }
        });
    };
    return MeteorEnvSetupTask;
}(SetupTask));
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
            script: path.resolve(SCRIPT_DIR, 'install-phantomjs.sh')
        });
    };
    return PhantomJsSetupTask;
}(SetupTask));
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
            src: path.resolve(TEMPLATES_DIR, 'mongodb.conf'),
            dest: '/etc/mongodb.conf'
        });
        taskList.executeScript('Installing MongoDB', {
            script: path.resolve(SCRIPT_DIR, 'install-mongodb.sh')
        });
    };
    return MongoSetupTask;
}(SetupTask));
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
            script: path.resolve(SCRIPT_DIR, 'install-stud.sh')
        });
    };
    SslSetupTask.prototype.configureStud = function (taskList, pemFilePath, port) {
        var backend = { host: '127.0.0.1', port: port };
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
            'command': "stud --test --config=" + this.deployPrefix + "/stud/stud.conf"
        });
        //restart stud
        taskList.execute('Starting Stud', {
            'command': '(sudo stop stud || :) && (sudo start stud || :)'
        });
    };
    return SslSetupTask;
}(SetupTask));
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
            src: path.resolve(TEMPLATES_DIR, 'meteor/systemd.conf'),
            dest: this.getConfigPath(),
            vars: this.extendArgs({}),
        });
    };
    return SystemdSetupTask;
}(SetupTask));
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
            src: path.resolve(TEMPLATES_DIR, 'meteor/upstart.conf'),
            dest: upstartConfig,
            vars: {
                deployPrefix: this.deployPrefix,
                appName: this.getAppName()
            }
        });
    };
    return UpstartSetupTask;
}(SetupTask));
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
            'src': path.resolve(TEMPLATES_DIR, 'env-vars'),
            'dest': this.appRoot + '/config/env-vars',
            'vars': this.extendArgs({ 'env': bashenv }),
        });
    };
    return EnvVarsTask;
}(Task_1.Task));
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
            'src': path.resolve(TEMPLATES_DIR, 'env.sh'),
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
}(Task_1.Task));
var StartProcessTask = (function (_super) {
    __extends(StartProcessTask, _super);
    function StartProcessTask(config, initSettings) {
        if (initSettings === void 0) { initSettings = {}; }
        _super.call(this, config);
        this.initSettings = initSettings;
    }
    StartProcessTask.prototype.describe = function () {
        return 'Invoking deployment process';
    };
    StartProcessTask.prototype.build = function (taskList) {
        var appName = this.config.app.name;
        taskList.executeScript(this.describe(), {
            'script': path.resolve(TEMPLATES_DIR, 'deploy.sh'),
            'vars': this.extendArgs({
                'deployCheckWaitTime': this.initSettings.checkDelay || 10
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
var LinuxTaskBuilder = (function () {
    function LinuxTaskBuilder() {
    }
    LinuxTaskBuilder.prototype.taskList = function (title) {
        return nodemiral.taskList(title);
    };
    LinuxTaskBuilder.prototype.setup = function (config) {
        var taskList = this.taskList('Setup (linux)');
        var tasks = [];
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
        tasks.push(new SystemdSetupTask(config));
        // build tasks into taskList
        tasks.forEach(function (t) {
            t.build(taskList);
        });
        return taskList;
    };
    LinuxTaskBuilder.prototype.deploy = function (config, bundlePath, env, checkDelay, appName) {
        var taskList = this.taskList("Deploy app '" + appName + "' (linux)");
        var copyBundle = new CopyBundleDeployTask(config, bundlePath);
        copyBundle.build(taskList);
        var bashEnvVars = new BashEnvVarsTask(config, env);
        bashEnvVars.build(taskList);
        var envVars = new EnvVarsTask(config, env);
        envVars.build(taskList);
        taskList.copy('Creating build.sh', {
            src: path.resolve(TEMPLATES_DIR, 'deploy.sh'),
            dest: DEPLOY_PREFIX + '/' + appName + '/build.sh',
            vars: {
                deployPrefix: DEPLOY_PREFIX,
                deployCheckWaitTime: checkDelay || 10,
                appName: appName
            }
        });
        var startProcess = new StartProcessTask(config, { checkDelay: checkDelay });
        startProcess.build(taskList);
        return taskList;
    };
    ;
    LinuxTaskBuilder.prototype.reconfig = function (env, appName) {
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
    };
    LinuxTaskBuilder.prototype.restart = function (appName) {
        var taskList = this.taskList("Restarting Application (linux)");
        //restarting
        taskList.execute('Restarting app', {
            command: '(sudo stop ' + appName + ' || :) && (sudo start ' + appName + ')'
        });
        return taskList;
    };
    LinuxTaskBuilder.prototype.stop = function (appName) {
        var taskList = this.taskList("Stopping Application (linux)");
        //stopping
        taskList.execute('Stopping app', {
            command: '(sudo stop ' + appName + ')'
        });
        return taskList;
    };
    LinuxTaskBuilder.prototype.start = function (appName) {
        var taskList = this.taskList("Starting Application (linux)");
        //starting
        taskList.execute('Starting app', {
            command: '(sudo start ' + appName + ')'
        });
        return taskList;
    };
    return LinuxTaskBuilder;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LinuxTaskBuilder;
//# sourceMappingURL=LinuxTaskBuilder.js.map