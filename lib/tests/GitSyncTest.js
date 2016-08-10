"use strict";
/// <reference path="../typings/globals/mocha/index.d.ts" />
/// <reference path="../typings/globals/chai/index.d.ts" />
var chai = require('chai');
var expect = chai.expect;
var GitSync_1 = require("../src/GitSync");
describe('GitSync', function () {
    describe('#describeAll', function () {
        it('should return ref name', function () {
            var git = new GitSync_1.GitSync('./');
            var tag = git.describeAll();
            expect(tag).to.be.string;
        });
    });
    describe('#describeTags', function () {
        it('should return the closest tag name with abbrev = 0', function () {
            var git = new GitSync_1.GitSync('./');
            var tag = git.describeTags(0);
            expect(tag).to.be.string;
        });
    });
    describe('#logOf', function () {
        it('should return a commit list', function () {
            var git = new GitSync_1.GitSync('./');
            var commits = git.logOf('master', { maxCount: 3 });
            // console.log(commits);
            expect(commits.length).to.equal(3);
            expect(commits[0].author).to.be.not.null;
            expect(commits[0].date).to.be.not.null;
            expect(commits[0].hash).to.be.a('string');
        });
    });
    describe('#tags', function () {
        it('should return a tag list', function () {
            var git = new GitSync_1.GitSync('./');
            var tags = git.tags();
            expect(tags).to.be.an('array');
        });
    });
});
//# sourceMappingURL=GitSyncTest.js.map