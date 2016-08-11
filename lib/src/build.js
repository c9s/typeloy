"use strict";
var spawn = require('child_process').spawn;
var archiver = require('archiver');
var fs = require('fs');
var pathResolve = require('path').resolve;
var _ = require('underscore');
/**
 * @param {Function(err)} callback
 */
function buildApp(config, appPath, buildLocation, bundlePath, start) {
    return new Promise(function (resolve, reject) {
        start = _.once(start);
        bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');
        if (fs.existsSync(bundlePath)) {
            console.log("Found existing bundle file: " + bundlePath);
            return resolve();
        }
        var meteorBinary = config.meteor.binary || 'meteor';
        start();
        return buildMeteorApp(appPath, meteorBinary, buildLocation, config)
            .then(function (code) {
            // 0 = success
            if (code == 0) {
                console.log("Build succeed. Archiving the files...");
                return archiveIt(buildLocation, bundlePath);
            }
            console.error("\n=> Build Error. Check the logs printed above.");
            return reject(new Error("Build error. Please check the console log output."));
        });
    });
}
exports.buildApp = buildApp;
function buildMeteorApp(appPath, executable, buildLocation, config) {
    var args = [
        "build",
        "--directory", buildLocation,
        "--server", (config.meteor.server || "http://localhost:3000"),
    ];
    var isWin = /^win/.test(process.platform);
    if (isWin) {
        // Sometimes cmd.exe not available in the path
        // See: http://goo.gl/ADmzoD
        executable = process.env.comspec || "cmd.exe";
        args = ["/c", "meteor"].concat(args);
    }
    var options = { "cwd": pathResolve(appPath) };
    if (config.meteor.env) {
        options['env'] = _.extend(process.env, config.meteor.env);
    }
    console.log("Building Meteor App");
    console.log("  ", executable, args.join(' '), options);
    return new Promise(function (resolve) {
        var meteor = spawn(executable, args, options);
        var stdout = "";
        var stderr = "";
        meteor.stdout.pipe(process.stdout, { end: false });
        meteor.stderr.pipe(process.stderr, { end: false });
        meteor.on('close', function (code) {
            resolve(code);
        });
    });
}
exports.buildMeteorApp = buildMeteorApp;
;
function archiveIt(buildLocation, bundlePath) {
    var sourceDir = pathResolve(buildLocation, 'bundle');
    bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');
    console.log("Creating tar bundle: " + bundlePath);
    console.log("Bundle source: " + sourceDir);
    return new Promise(function (resolve, reject) {
        var output = fs.createWriteStream(bundlePath);
        var archive = archiver('tar', {
            gzip: true,
            gzipOptions: {
                level: 6
            }
        });
        archive.pipe(output);
        output.once('close', function () {
            resolve();
        });
        archive.once('error', function (err) {
            console.log("=> Archiving failed:", err.message);
            reject(err);
        });
        archive.directory(sourceDir, 'bundle').finalize();
    });
}
//# sourceMappingURL=build.js.map