const baseOptions = require('virmator/base-configs/base-mocharc.js');

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    ...baseOptions,
    parallel: false,
    watch: './src/',
};

module.exports = mochaConfig;
