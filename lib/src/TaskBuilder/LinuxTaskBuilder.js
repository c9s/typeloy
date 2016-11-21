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
var uuid = require('uuid');
var _ = require('underscore');
var DEPLOY_PREFIX = "/opt";
var BaseTaskBuilder_1 = require("./BaseTaskBuilder");
var tasks_1 = require("../tasks");
var SetupTaskListBuilder = (function () {
    function SetupTaskListBuilder(builder) {
        this.builder = builder;
    }
    SetupTaskListBuilder.prototype.definitions = function (config) {
        var defs = {
            "updatePackages": new tasks_1.PkgUpdateTask(config),
            "node": new tasks_1.NodeJsSetupTask(config),
            "phantom": new tasks_1.PhantomJsSetupTask(config),
            "environment": new tasks_1.MeteorEnvSetupTask(config),
            "mongo": new tasks_1.MongoSetupTask(config),
        };
        var siteConfig = this.builder.getSiteConfig();
        if (siteConfig.ssl) {
            defs["stud"] = new tasks_1.StudSetupTask(config, siteConfig.ssl);
            if (siteConfig.ssl.certbot) {
                var certbotConfig = siteConfig.ssl.certbot;
                if (!certbotConfig.domain) {
                    throw new Error("certbot.domain is not defined");
                }
                if (!certbotConfig.email) {
                    throw new Error("certbot.email is not defined");
                }
                defs["certbot"] = new tasks_1.CertbotSetupTask(config, certbotConfig.domain, certbotConfig.email);
                defs["certbotRenew"] = new tasks_1.CertbotRenewTask(config, certbotConfig.domain, certbotConfig.email);
            }
        }
        return defs;
    };
    SetupTaskListBuilder.prototype.buildDefaultTasks = function (config, definitions) {
        var tasks = [];
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
    };
    SetupTaskListBuilder.prototype.build = function (config, taskNames) {
        var taskList = nodemiral.taskList('Setup Tasks');
        var taskDefinitions = this.definitions(config);
        if (taskNames) {
            var tasks = _(taskNames).chain().map(function (taskName) {
                return taskDefinitions[taskName];
            }).filter(function (x) { return x ? true : false; }).value();
            tasks.forEach(function (t) { return t.build(taskList); });
        }
        else {
            var tasks = this.buildDefaultTasks(config, taskDefinitions);
            tasks.forEach(function (t) { return t.build(taskList); });
        }
        return taskList;
    };
    return SetupTaskListBuilder;
}());
var DeployTaskListBuilder = (function () {
    function DeployTaskListBuilder() {
    }
    DeployTaskListBuilder.build = function (config, bundlePath, env) {
        var taskList = nodemiral.taskList("Deploy app '" + config.app.name + "'");
        var tasks = [];
        tasks.push(new tasks_1.CopyBundleDeployTask(config, bundlePath));
        tasks.push(new tasks_1.BashEnvVarsTask(config, env));
        tasks.push(new tasks_1.EnvVarsTask(config, env));
        tasks.push(new tasks_1.StartProcessTask(config));
        tasks.forEach(function (t) {
            t.build(taskList);
        });
        return taskList;
    };
    return DeployTaskListBuilder;
}());
var LinuxTaskBuilder = (function (_super) {
    __extends(LinuxTaskBuilder, _super);
    function LinuxTaskBuilder() {
        _super.apply(this, arguments);
    }
    LinuxTaskBuilder.prototype.getSiteConfig = function () {
        return this.sessionGroup._siteConfig;
    };
    LinuxTaskBuilder.prototype.taskList = function (title) {
        return nodemiral.taskList(title);
    };
    LinuxTaskBuilder.prototype.setup = function (config, taskNames) {
        var builder = new SetupTaskListBuilder(this);
        return builder.build(config, taskNames);
    };
    LinuxTaskBuilder.prototype.deploy = function (config, bundlePath, env) {
        return DeployTaskListBuilder.build(config, bundlePath, env);
    };
    ;
    LinuxTaskBuilder.prototype.reconfig = function (env, config) {
        var taskList = this.taskList("Reconfiguring Application");
        var tasks = [];
        tasks.push(new tasks_1.EnvVarsTask(config, env));
        tasks.push(new tasks_1.RestartTask(config));
        tasks.forEach(function (t) {
            t.build(taskList);
        });
        return taskList;
    };
    LinuxTaskBuilder.prototype.mongoGet = function (config, file) {
        var tasks = [];
        if (config.mongo) {
            tasks.push(new tasks_1.MongoDumpTask(config));
            tasks.push(new tasks_1.MongoGetTask(config, file));
        }
        else {
            console.error("mongo settings is not configured.");
        }
        var taskList = this.taskList("MongoDB Get");
        tasks.forEach(function (t) {
            t.build(taskList);
        });
        return taskList;
    };
    LinuxTaskBuilder.prototype.mongoRestore = function (config, localFile) {
        var tasks = [];
        if (config.mongo) {
            // const tmpFile = `/opt/${config.app.name}/tmp/mongo-restore-${uuid.v4()}.gz`;
            var tmpFile = "/tmp/mongo-restore-" + uuid.v4() + ".gz";
            tasks.push(new tasks_1.UploadTask(config, localFile, tmpFile, true));
            tasks.push(new tasks_1.StopTask(config));
            tasks.push(new tasks_1.MongoRestoreTask(config, tmpFile));
            tasks.push(new tasks_1.StartTask(config));
        }
        else {
            console.error("mongo settings is not configured.");
        }
        var taskList = this.taskList("MongoDB Restore");
        tasks.forEach(function (t) {
            t.build(taskList);
        });
        return taskList;
    };
    LinuxTaskBuilder.prototype.mongoDump = function (config) {
        var tasks = [];
        if (config.mongo) {
            tasks.push(new tasks_1.MongoDumpTask(config));
        }
        else {
            console.error("mongo settings is not configured.");
        }
        var taskList = this.taskList("MongoDB Dump");
        tasks.forEach(function (t) {
            t.build(taskList);
        });
        return taskList;
    };
    LinuxTaskBuilder.prototype.restart = function (config) {
        var tasks = [];
        tasks.push(new tasks_1.RestartTask(config));
        var taskList = this.taskList("Restarting Application");
        tasks.forEach(function (t) {
            t.build(taskList);
        });
        return taskList;
    };
    LinuxTaskBuilder.prototype.logs = function (config, hostPrefix, logOptions) {
        var tasks = [];
        tasks.push(new tasks_1.LogsTask(config, hostPrefix, logOptions));
        var taskList = this.taskList("Getting Application Log");
        tasks.forEach(function (t) {
            t.build(taskList);
        });
        return taskList;
    };
    LinuxTaskBuilder.prototype.stop = function (config) {
        var taskList = this.taskList("Stopping Application");
        var tasks = [];
        tasks.push(new tasks_1.StopTask(config));
        tasks.forEach(function (t) {
            t.build(taskList);
        });
        return taskList;
    };
    LinuxTaskBuilder.prototype.start = function (config) {
        var taskList = this.taskList("Starting Application");
        var tasks = [];
        tasks.push(new tasks_1.StartTask(config));
        tasks.forEach(function (t) {
            t.build(taskList);
        });
        return taskList;
    };
    return LinuxTaskBuilder;
}(BaseTaskBuilder_1.BaseTaskBuilder));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LinuxTaskBuilder;
//# sourceMappingURL=LinuxTaskBuilder.js.map