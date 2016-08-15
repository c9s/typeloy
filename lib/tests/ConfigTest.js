"use strict";
/// <reference path="../typings/globals/mocha/index.d.ts" />
/// <reference path="../typings/globals/chai/index.d.ts" />
var chai = require('chai');
var expect = chai.expect;
var config_1 = require("../src/config");
describe('Config', function () {
    describe('#parse', function () {
        it('should parse new sites config', function () {
            var config = config_1.ConfigParser.parse('tests/data/typeloy-sites.json');
            expect(config.sites).to.be.not.null;
            expect(config.sites['dev']).to.be.not.null;
        });
        it('should parse legacy mup.json', function () {
            var config = config_1.ConfigParser.parse('tests/data/mup.json');
            expect(config.sites['default']).to.be.ok;
            expect(config.deploy.checkDelay).to.equal(120);
            expect(config.setup.nodeVersion).to.equal('0.10.44');
            expect(config.setup.phantom).to.be.true;
            expect(config.setup.mongo).to.be.true;
        });
    });
});
//# sourceMappingURL=ConfigTest.js.map