/// <reference path='../../node_modules/@types/mocha/index.d.ts' />
/// <reference path='../../node_modules/@types/chai/index.d.ts' />

import * as schema from '../lib/nodes/schema.js';
import * as meta from '../lib/meta.js';

suite('src', () => {
    test('load', (done) => {
        fetch('/src/test/yang/x.json').then((resp: Response) => {
            resp.json().then((data: any) => {
                schema.load(data).then((m: meta.Module) => {
                    assert.equal('x', m.ident);
                    done();
                });
            });
        });
    });
});

