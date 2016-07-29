#!/usr/bin/env node
"use strict";
var path = require('path');
var config_1 = require('../config');
var actions_1 = require('../actions');
require('colors');
var prog = require('commander');
var version = '1.0.0';
var cwd = path.resolve('.');
// read config and validate it
var config = config_1.readConfig();
var actionsRegistry = new actions_1.default(config, cwd);
prog.version(version);
prog.usage('[options] <subcommand> ...');
prog.option('-v, --verbose', 'verbose mode');
prog.command('deploy [version] [sites...]')
    .description('set the deployment version and start deploying.')
    .option("-d, --dryrun", 'do not really deploy it.')
    .action(function (version, sites, options) {
    actionsRegistry.deploy(options);
});
prog.command('setup')
    .description('setup the requirements on the target server.')
    .action(function (env, options) {
    actionsRegistry.setup();
});
prog.command('logs')
    .description('init the mup.json config.')
    .option("-f, --tail", 'tail')
    .action(function (options) {
    actionsRegistry.logs(options);
});
prog.command('init')
    .description('init the mup.json config.')
    .action(function (env, options) {
    actionsRegistry.init();
});
prog.command('start')
    .description('start the app.')
    .action(function (env, options) {
    actionsRegistry.start();
});
;
prog.command('stop')
    .description('stop the app.')
    .action(function (env, options) {
    actionsRegistry.stop();
});
;
prog.command('restart')
    .description('restart the app.')
    .action(function (env, options) {
    actionsRegistry.restart();
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