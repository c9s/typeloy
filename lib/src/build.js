"use strict";
var spawn = require('child_process').spawn;
var archiver = require('archiver');
var fs = require('fs');
var pathResolve = require('path').resolve;
var _ = require('underscore');
var MeteorBuilder = (function () {
    function MeteorBuilder(config) {
        this.config = config;
    }
    /**
    * @param {Function(err)} callback
    */
    MeteorBuilder.prototype.buildApp = function (appPath, buildLocation, bundlePath, start) {
        var _this = this;
        var buildFinish = new Promise(function (resolve, reject) {
            start = _.once(start);
            bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');
            if (fs.existsSync(bundlePath)) {
                console.log("Found existing bundle file: " + bundlePath);
                return resolve(0);
            }
            var meteorBinary = _this.config.meteor.binary || 'meteor';
            start();
            buildMeteorApp(appPath, meteorBinary, buildLocation, _this.config)
                .then(function (code) {
                if (code == 0) {
                    resolve(code);
                }
                else {
                    reject(code);
                }
            });
        });
        buildFinish.catch(function (code) {
            console.error("\n=> Build Error. Check the logs printed above.");
            throw new Error("Build error. Please check the console log output.");
        });
        return buildFinish.then(function (code) {
            // 0 = success
            console.log("Build succeed.");
            return archiveIt(buildLocation, bundlePath, {
                level: 6,
            });
        });
    };
    return MeteorBuilder;
}());
exports.MeteorBuilder = MeteorBuilder;
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
    return new Promise(function (resolve, reject) {
        var meteor = spawn(executable, args, options);
        var stdout = "";
        var stderr = "";
        meteor.stdout.pipe(process.stdout, { end: false });
        meteor.stderr.pipe(process.stderr, { end: false });
        meteor.on('close', function (code) {
            if (code != 0) {
                return reject(code);
            }
            resolve(code);
        });
    });
}
exports.buildMeteorApp = buildMeteorApp;
;
function archiveIt(buildLocation, bundlePath, gzipOptions) {
    var sourceDir = pathResolve(buildLocation, 'bundle');
    bundlePath = bundlePath || pathResolve(buildLocation, 'bundle.tar.gz');
    console.log('Archiving the files...');
    console.log("Creating tar bundle at: " + bundlePath);
    console.log("Bundle source: " + sourceDir);
    return new Promise(function (resolve, reject) {
        var output = fs.createWriteStream(bundlePath);
        var archive = archiver('tar', {
            gzip: true,
            gzipOptions: gzipOptions
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