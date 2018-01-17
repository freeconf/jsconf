/// <reference path='../../node_modules/@types/mocha/index.d.ts' />
/// <reference path='../../node_modules/@types/chai/index.d.ts' />

import * as schema from '../lib/schema.js';

suite('freeconf', () => {
    suite('src', () => {
        test('x', (done) => {
            fetch('/src/test/yang/x.json').then((resp: Response) => {
                resp.json().then((data: any) => {
                    const m = schema.load(data);
                    assert.equal("x", m.ident);
                    done();
                })
            });
        });
    });
});

