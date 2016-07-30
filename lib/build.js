"use strict";
var spawn = require('child_process').spawn;
var archiver = require('archiver');
var fs = require('fs');
var pathResolve = require('path').resolve;
var profile_1 = require('./profile');
var _ = require('underscore');
/**
 * @param {Function(err)} callback
 */
exports.buildApp = profile_1.default("buildApp", function (appPath, meteorBinary, buildLocation, bundlePath, callback) {
    callback = _.once(callback);
    bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');
    if (fs.existsSync(bundlePath)) {
        console.log("Found existing bundle file: " + bundlePath);
        return callback();
    }
    buildMeteorApp(appPath, meteorBinary, buildLocation, function (code) {
        if (code == 0) {
            archiveIt(buildLocation, bundlePath, callback);
        }
        else {
            console.log("\n=> Build Error. Check the logs printed above.");
            callback(new Error("build-error"));
        }
    });
});
var buildMeteorApp = profile_1.default("buildMeteorApp", function (appPath, executable, buildLocation, callback) {
    var args = [
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
    var options = { "cwd": appPath };
    console.log("Building Meteor App: ", executable, args, options);
    var meteor = spawn(executable, args, options);
    var stdout = "";
    var stderr = "";
    meteor.stdout.pipe(process.stdout, { end: false });
    meteor.stderr.pipe(process.stderr, { end: false });
    meteor.on('close', callback);
});
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