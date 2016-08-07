#!/usr/bin/env node
"use strict";
const path = require('path');
const config_1 = require('../src/config');
const actions_1 = require('../src/actions');
const Deployment_1 = require('../src/Deployment');
require('colors');
var prog = require('commander');
var version = '1.0.0';
var cwd = path.resolve('.');
prog.version(version);
prog.usage('[options] <subcommand> ...');
prog.option('-v, --verbose', 'verbose mode');
prog.option('-c, --config <file>', 'config file');
prog.command('deploy [tag] [sites...]')
    .description('set the deployment tag and start deploying.')
    .option("-d, --dryrun", 'do not really deploy it.')
    .option("--bundle-file <file>", 'the bundle file you have already built with meteor build.')
    .option("--build-dir <dir>", 'the meteor build directory.')
    .option("-C, --no-clean", 'whether to clean up the bundle files.')
    .action((deploymentTag, sites, options) => {
    let config = config_1.readConfig(prog.config);
    let actions = new actions_1.default(config, cwd);
    if (!deploymentTag) {
        deploymentTag = "v" + (new Date).getTime();
    }
    Deployment_1.default.create(config, cwd, deploymentTag).then((deployment) => {
        actions.deploy(deployment, sites, options);
    });
});
prog.command('setup')
    .description('setup the requirements on the target server.')
    .action((env, options) => {
    let config = config_1.readConfig(prog.config);
    let actions = new actions_1.default(config, cwd);
    actions.setup(null);
});
prog.command('logs')
    .description('init the mup.json config.')
    .option("-f, --tail", 'tail')
    .action((options) => {
    let config = config_1.readConfig(prog.config);
    let actions = new actions_1.default(config, cwd);
    actions.logs(options);
});
prog.command('init')
    .description('init the mup.json config.')
    .action((env, options) => {
    let config = config_1.readConfig(prog.config);
    let actions = new actions_1.default(config, cwd);
    actions.init();
});
prog.command('start')
    .description('start the app.')
    .action((env, options) => {
    let config = config_1.readConfig(prog.config);
    let actions = new actions_1.default(config, cwd);
    actions.start(null);
});
;
prog.command('stop')
    .description('stop the app.')
    .action((env, options) => {
    let config = config_1.readConfig(prog.config);
    let actions = new actions_1.default(config, cwd);
    actions.stop(null);
});
;
prog.command('restart')
    .description('restart the app.')
    .action((env, options) => {
    let config = config_1.readConfig(prog.config);
    let actions = new actions_1.default(config, cwd);
    actions.restart(null);
});
;
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