/// <reference path='../../node_modules/@types/mocha/index.d.ts' />
/// <reference path='../../node_modules/@types/chai/index.d.ts' />


import * as rc from '../lib/restconf.js';

suite('restconf', () => {
    test('findDeviceIdInUrl', () => {
        assert.equal('abc', rc.findDeviceIdInUrl('http://server:99/restconf=abc/data'));
        assert.equal('', rc.findDeviceIdInUrl('http://server:99/restconf/data'));
    });
});
