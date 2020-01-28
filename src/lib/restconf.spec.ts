import * as rc from './restconf';
import * as src from './src';
import * as node from './node';
import * as bird from './bird';
import * as reflect from './nodes/reflect';
import { expect } from 'chai';
import 'mocha';

console.log("restconf_test");

describe('restconf', () => {

    it('findDeviceIdInUrl', () => {
        expect(rc.findDeviceIdInUrl('http://server:99/restconf=abc/data')).to.equal('abc');
        expect(rc.findDeviceIdInUrl('http://server:99/restconf/data')).to.equal('');
    });

    it('clientNode', async () =>  {
        const ypath = src.dir('./testdata/yang');
        
        it('write', async () => {
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
            await b.Root().upsertInto(cn.node());
            const expected  = [
                'GET - bird?depth=1&content=config&with-defaults=trim null',
                'PUT - bird? {"bird":[{"name":"bluejay","wingspan":10,"species":{"name":"jay"}}]}'
            ]
            for (let i = 0; i < expected.length; i++) {
                expect(actual[i]).to.equal(expected[i]);
            }
            expect(JSON.stringify(response)).to.equal('{}');    
        });
    });
});
