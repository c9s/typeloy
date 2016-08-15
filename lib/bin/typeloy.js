#!/usr/bin/env node
"use strict";
var path = require('path');
var _ = require('underscore');
var config_1 = require('../src/config');
var actions_1 = require('../src/actions');
var SummaryMap_1 = require("../src/SummaryMap");
var Deployment_1 = require('../src/Deployment');
require('colors');
var prog = require('commander');
var version = '1.3.0';
var cwd = path.resolve('.');
prog.version(version);
prog.usage('[options] <subcommand> ...');
prog.option('-v, --verbose', 'verbose mode');
prog.option('-c, --config <file>', 'config file');
prog.command('deploy [sites...]')
    .description('set the deployment tag and start deploying.')
    .option("-d, --dryrun", 'do not really deploy it.')
    .option("--bundle-file <file>", 'the bundle file you have already built with meteor build.')
    .option("--build-dir <dir>", 'the meteor build directory.')
    .option("--tag <tag>", 'deployment tag')
    .option("-C, --no-clean", 'whether to clean up the bundle files.')
    .action(function (sites, options) {
    var config = config_1.readConfig(prog.config);
    var deployment = Deployment_1.Deployment.create(config, options.tag);
    var a = new actions_1.DeployAction(config);
    var afterDeploy = a.run(deployment, sites, options);
    afterDeploy.then(function (mapResult) {
        console.log(JSON.stringify(mapResult, null, "  "));
        var errorCode = SummaryMap_1.haveSummaryMapsErrors(mapResult) ? 1 : 0;
        console.log("returned code", errorCode);
        // console.log("After deploy", mapResult);
    });
    afterDeploy.catch(function (res) {
        console.error(res);
    });
});
prog.command('setup [sites...]')
    .description('setup the requirements on the target server.')
    .action(function (sites, options) {
    var config = config_1.readConfig(prog.config);
    var a = new actions_1.SetupAction(config);
    var deployment = Deployment_1.Deployment.create(config, config.app.root || cwd);
    a.run(deployment, sites);
});
prog.command('logs [sites...]')
    .description('tail the logs')
    .option("-f, --tail", 'tail')
    .option("--init <init>", 'init type, could be "systemd".')
    .action(function (sites, options) {
    var config = config_1.readConfig(prog.config);
    var a = new actions_1.LogsAction(config);
    var deployment = Deployment_1.Deployment.create(config, config.app.root || cwd);
    a.run(deployment, sites, options);
});
prog.command('start [sites...]')
    .description('start the app.')
    .action(function (sites, options) {
    var config = config_1.readConfig(prog.config);
    var actions = new actions_1.StartAction(config);
    var deployment = Deployment_1.Deployment.create(config, config.app.root || cwd);
    actions.run(deployment, sites);
});
;
prog.command('stop [sites...]')
    .description('stop the app.')
    .action(function (sites, options) {
    var config = config_1.readConfig(prog.config);
    var actions = new actions_1.StopAction(config);
    var deployment = Deployment_1.Deployment.create(config, config.app.root || cwd);
    actions.run(deployment, sites);
});
;
prog.command('restart [sites...]')
    .description('restart the app.')
    .action(function (sites, options) {
    var config = config_1.readConfig(prog.config);
    var actions = new actions_1.RestartAction(config);
    var deployment = Deployment_1.Deployment.create(config, config.app.root || cwd);
    var afterSetup = actions.run(deployment, sites);
    afterSetup.then(function (result) {
        console.log(result);
    }).catch(function (err) {
        console.error(err);
    });
});
;
prog.command('init')
    .description('init the mup.json config.')
    .action(function (env, options) {
    var config = config_1.readConfig(prog.config);
    var actions = new actions_1.BaseAction(config);
    actions.init();
});
/*
// handling undefined command
prog.command('*')
  .action(function(env){
    console.log('deploying "%s"', env);
  });
*/
prog.on('--help', function () {
    /*
    console.log('  Examples:');
    console.log('');
    console.log('    $ custom-help --help');
    console.log('    $ custom-help -h');
    console.log('');
    */
});
prog.parse(process.argv);
//# sourceMappingURL=typeloy.js.map