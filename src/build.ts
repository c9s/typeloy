var spawn = require('child_process').spawn;
var archiver = require('archiver');
var fs = require('fs');
var pathResolve = require('path').resolve;

import _ = require('underscore');

type Path = string;

/**
 * @param {Function(err)} callback
 */
export function buildApp(appPath:Path, meteorBinary:Path, buildLocation:Path, bundlePath:Path,
                         start,
                         done) {

  start = _.once(start);
  done = _.once(done);
  bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');
  if (fs.existsSync(bundlePath)) {
    console.log("Found existing bundle file: " + bundlePath);
    return done();
  }
  start();
  buildMeteorApp(appPath, meteorBinary, buildLocation, function(code) {
    if (code == 0) {
      archiveIt(buildLocation, bundlePath, done);
    } else {
      console.log("\n=> Build Error. Check the logs printed above.");
      done(new Error("build-error"));
    }
  });
}

export function buildMeteorApp(appPath:Path, executable:Path, buildLocation:Path, callback) {
  var args : Array<string> = [
    "build", "--directory", buildLocation, 
    "--server", "http://localhost:3000"
  ];
  
  var isWin = /^win/.test(process.platform);
  if (isWin) {
    // Sometimes cmd.exe not available in the path
    // See: http://goo.gl/ADmzoD
    executable = process.env.comspec || "cmd.exe";
    args = ["/c", "meteor"].concat(args);
  }

  var options = {"cwd": appPath};

  console.log("Building Meteor App: ", executable, args, options);

  var meteor = spawn(executable, args, options);
  var stdout = "";
  var stderr = "";
  meteor.stdout.pipe(process.stdout, {end: false});
  meteor.stderr.pipe(process.stderr, {end: false});
  meteor.on('close', callback);
};

function archiveIt(buildLocation:string, bundlePath:string, callback) {
  let sourceDir = pathResolve(buildLocation, 'bundle');
  bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');
  callback = _.once(callback);

  console.log("Creating tar bundle: " + bundlePath);
  console.log("Bundle source: " + sourceDir);

  var output  = fs.createWriteStream(bundlePath);
  var archive = archiver('tar', {
    gzip: true,
    gzipOptions: {
      level: 6
    }
  });

  archive.pipe(output);
  output.once('close', callback);

  archive.once('error', (err) => {
    console.log("=> Archiving failed:", err.message);
    callback(err);
  });
  archive.directory(sourceDir, 'bundle').finalize();
}
