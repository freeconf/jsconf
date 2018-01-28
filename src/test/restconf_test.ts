/// <reference path='../../node_modules/@types/mocha/index.d.ts' />
/// <reference path='../../node_modules/@types/chai/index.d.ts' />


import { findDeviceIdInUrl } from '../lib/restconf.js';

suite('restconf', () => {
    test('findDeviceIdInUrl', () => {
        assert.equal('abc', findDeviceIdInUrl('http://server:99/restconf=abc/data'));
        assert.equal('', findDeviceIdInUrl('http://server:99/restconf/data'));
    });
});
