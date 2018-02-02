/// <reference path='../../node_modules/@types/mocha/index.d.ts' />
/// <reference path='../../node_modules/@types/chai/index.d.ts' />

import * as src from '../lib/src.js';
import * as bird from '../lib/bird.js';
import * as nodes from '../lib/nodes.js';


suite('device', () => {
    test('bird', async () => {
        const ypath = src.webDir("/test/yang/");
        const d = await bird.create(ypath);
        const actual = await nodes.toJson(d.browser("bird").Root());
        assert.equal("x", actual);''
    });
});

