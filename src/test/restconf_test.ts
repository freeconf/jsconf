/// <reference path='../../node_modules/@types/mocha/index.d.ts' />
/// <reference path='../../node_modules/@types/chai/index.d.ts' />


import * as rc from '../lib/restconf.js';
import * as src from '../lib/src.js';
import * as node from '../lib/node.js';
import * as bird from '../lib/bird.js';
import * as reflect from '../lib/nodes/reflect.js';

console.log("restconf_test");

suite('restconf', () => {

    test('findDeviceIdInUrl', () => {
        assert.equal('abc', rc.findDeviceIdInUrl('http://server:99/restconf=abc/data'));
        assert.equal('', rc.findDeviceIdInUrl('http://server:99/restconf/data'));
    });

    test('clientNode', async () =>  {
        const ypath = src.webDir('/test/yang/');
        let actual:string[] = [];
        let response = {};
        const rest: rc.RestClient = {
            request: async (method: string, p: node.Path, params: string, payload: Buffer | null) => {
                actual.push(`${method} - ${p}?${params} ${payload}`);
                return await reflect.node(response);
            }
        };
        const cn = new rc.ClientNode(rest, 'id');
        const b = await bird.browser(ypath);

        test('read', async () => {
            await b.Root().upsertInto(cn.node());
            const expected  = [
                'GET - bird?depth=1&content=config&with-defaults=trim null',
                'PUT - bird? {"bird":[{"name":"bluejay","wingspan":10,"species":{"name":"jay"}}]}'
            ]
            for (let i = 0; i < expected.length; i++) {
                assert.equal(expected[i], actual[i]);
            }
            assert.equal('{}', JSON.stringify(response));    
        });

        test('write', async () => {
            await b.Root().upsertInto(cn.node());
            const expected  = [
                'GET - bird?depth=1&content=config&with-defaults=trim null',
                'PUT - bird? {"bird":[{"name":"bluejay","wingspan":10,"species":{"name":"jay"}}]}'
            ]
            for (let i = 0; i < expected.length; i++) {
                assert.equal(expected[i], actual[i]);
            }
            assert.equal('{}', JSON.stringify(response));    
        });
    });
});
