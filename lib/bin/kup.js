#!/usr/bin/env node
"use strict";
var path = require('path');
var Config = require('../config');
var actions_1 = require('../actions');
require('colors');
var prog = require('commander');
var version = '1.0.0';
var cwd = path.resolve('.');
// read config and validate it
var config = Config.read();
var actionsRegistry = new actions_1.default(config, cwd);
prog.version(version);
prog.option('-v, --verbose', 'verbose mode');
prog.command('deploy [version] ([site1] [site2] ...)')
    .description('set the deployment version and start deploying.')
    .action(function (env, options) {
    actionsRegistry.deploy();
});
prog.command('setup')
    .description('setup the requirements on the target server.')
    .action(function (env, options) {
    actionsRegistry.setup();
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
//# sourceMappingURL=kup.js.map