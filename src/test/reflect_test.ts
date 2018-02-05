/// <reference path='../../node_modules/@types/mocha/index.d.ts' />
/// <reference path='../../node_modules/@types/chai/index.d.ts' />

import * as nodes from '../lib/nodes.js';
import * as reflect from '../lib/nodes/reflect.js';
import * as schema from '../lib/nodes/schema.js';
import * as node from '../lib/node.js';


suite('reflect', () => {
    test('write', async () => {
        const mod = await schema.load({
            module: {
                ident: "m",
                dataDef: [
                    {
                        ident: "l",
                        list: {
                            key: ["id"],
                            dataDef: [
                                {
                                    ident: "id",
                                    leaf: {
                                        type: {
                                            ident: "string",
                                            format: "string"
                                        }
                                    }
                                }]
                        }
                    }]
            }
        });
        const n = reflect.node({
            l : [{
                id : "x"
            }]
        });
        const b = new node.Browser(mod, n);
        const actual = await nodes.toJson(b.Root());
        assert.equal('{"l":[{"id":"x"}]}', actual);''
    });
});

