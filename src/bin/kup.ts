#!/usr/bin/env node
import path = require('path');
import Config = require('../config');
import ActionsRegistry from '../actions';
require('colors');

var prog = require('commander');

var version = '0.1.0';
var cwd = path.resolve('.');
// read config and validate it
var config = Config.read();
var actionsRegistry = new ActionsRegistry(config, cwd);

prog.version(version);
prog.option('-v, --verbose', 'verbose mode');

prog.command('deploy [version] ([site1] [site2] ...)')
  .description('set the deployment version and start deploying.')
  // .option("-s, --setup_mode [mode]", "Which setup mode to use")
  .action( (env, options) => {
  })
  ;

prog.command('setup')
  .description('setup the requirements on the target server.');

prog.command('init')
  .description('init the mup.json config.');

prog.command('start')
  .description('start the app.');

prog.command('stop')
  .description('stop the app.');

prog.command('restart')
  .description('restart the app.');

prog.on('--help', function(){
  console.log('  Examples:');
  console.log('');
  console.log('    $ custom-help --help');
  console.log('    $ custom-help -h');
  console.log('');
});

prog.parse(process.argv);


/*
runActions(config, cwd);
function runActions(config, cwd) {
  var actionsRegistry = new ActionsRegistry(config, cwd);
  if(actionsRegistry[action]) {
    actionsRegistry[action]();
  } else {
    if(typeof action !== "undefined") {
      var errorMessage = 'No Such Action Exists: ' + action;
      console.error(errorMessage.bold.red);
    }
    // helpers.printHelp();
  }
}
*/

/*
console.log('\nkup : Production Quality Meteor Deployments'.bold.blue);
console.log('------------------------------------------------\n'.bold.blue);
var action = process.argv[2];
if(action == 'init') {
  //special setup for init
  ActionsRegistry.init();
} else {
}


*/
