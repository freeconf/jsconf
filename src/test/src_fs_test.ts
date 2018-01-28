/// <reference path='../../node_modules/@types/mocha/index.d.ts' />
/// <reference path='../../node_modules/@types/chai/index.d.ts' />

import {dir} from '../lib/src_fs.js';

suite('src_fs', () => {
    test('dir', () => {
        const b = dir('./dir');
        const found = b.load('hello', 'txt');
        assert.equal('hello', found.toString());
    });
});