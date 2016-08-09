"use strict";
var spawn = require('child_process').spawn;
var archiver = require('archiver');
var fs = require('fs');
var pathResolve = require('path').resolve;
var _ = require('underscore');
/**
 * @param {Function(err)} callback
 */
function buildApp(appPath, meteorBinary, buildLocation, bundlePath, start, done) {
    start = _.once(start);
    done = _.once(done);
    bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');
    if (fs.existsSync(bundlePath)) {
        console.log("Found existing bundle file: " + bundlePath);
        return done(null);
    }
    start();
    buildMeteorApp(appPath, meteorBinary, buildLocation, {}, function (code) {
        if (code == 0) {
            // Success
            console.log("Build succeed. Archiving the files...");
            archiveIt(buildLocation, bundlePath, done);
        }
        else {
            console.error("\n=> Build Error. Check the logs printed above.");
            done(new Error("Build error. Please check the console log output."));
        }
    });
}
exports.buildApp = buildApp;
function buildMeteorApp(appPath, executable, buildLocation, config, done) {
    var args = [
        "build",
        "--directory", buildLocation,
        "--server", (config.server || "http://localhost:3000"),
    ];
    var isWin = /^win/.test(process.platform);
    if (isWin) {
        // Sometimes cmd.exe not available in the path
        // See: http://goo.gl/ADmzoD
        executable = process.env.comspec || "cmd.exe";
        args = ["/c", "meteor"].concat(args);
    }
    var options = { "cwd": pathResolve(appPath) };
    console.log("Building Meteor App");
    console.log("  ", executable, args.join(' '), options);
    var meteor = spawn(executable, args, options);
    var stdout = "";
    var stderr = "";
    meteor.stdout.pipe(process.stdout, { end: false });
    meteor.stderr.pipe(process.stderr, { end: false });
    meteor.on('close', done);
}
exports.buildMeteorApp = buildMeteorApp;
;
function archiveIt(buildLocation, bundlePath, callback) {
    var sourceDir = pathResolve(buildLocation, 'bundle');
    bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');
    callback = _.once(callback);
    console.log("Creating tar bundle: " + bundlePath);
    console.log("Bundle source: " + sourceDir);
    var output = fs.createWriteStream(bundlePath);
    var archive = archiver('tar', {
        gzip: true,
        gzipOptions: {
            level: 6
        }
    });
    archive.pipe(output);
    output.once('close', callback);
    archive.once('error', function (err) {
        console.log("=> Archiving failed:", err.message);
        callback(err);
    });
    archive.directory(sourceDir, 'bundle').finalize();
}
//# sourceMappingURL=build.js.map