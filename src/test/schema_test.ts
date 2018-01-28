/// <reference path='../../node_modules/@types/mocha/index.d.ts' />
/// <reference path='../../node_modules/@types/chai/index.d.ts' />

import * as meta from '../lib/meta.js';
import * as schema from '../lib/schema.js';
import * as val from '../lib/val.js';
import * as node from '../lib/node.js';
import * as nodes from '../lib/nodes.js';
import { yangModule } from '../lib/schema.js';

suite('schema', () => {

    test('yang', () => {
        const m = yangModule();
        assert.equal('yang', m.ident);
        const mdef = m.definition('module') as meta.Container;
        const ddef = mdef.definition('dataDef') as meta.List;
        const ldef = ddef.definition('leaf') as meta.Container;
        assert.equal(5, ldef.dataDef.length);
    });

    test('load', async () => {
        const m = await schema.load({
            module: {
                ident: 'x',
                dataDef: [
                    {
                        ident: 'l',
                        leaf: {
                            type: {
                                ident: 'string',
                                format: 'string'
                            }
                        }
                    }, {
                        ident: 'c',
                        container: {
                            dataDef: [
                                {
                                    ident: 'l2',
                                    leaf: {
                                        type: {
                                            ident: 'int32',
                                            format: 'int32'
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        });
        assert.equal('x', m.ident);
        assert.equal(2, m.dataDef.length);
        const l = (m.dataDef[0] as meta.Leaf);
        assert.equal('l', l.ident);
        console.log(l.type);
        assert.equal(val.Format.Str, l.type.format);
        const c = (m.dataDef[1] as meta.Container);
        assert.equal('c', c.ident);
    });

    test('rw', async () => {
        const m = await schema.load({
            module: {
                ident: 'x',
                dataDef: [
                    {
                        ident: 'l',
                        leaf: {
                            type: {
                                ident: 'string',
                                format: 'string'
                            }
                        }
                    }, {
                        ident: 'c',
                        container: {
                            dataDef: [
                                {
                                    ident: 'l2',
                                    leaf: {
                                        type: {
                                            ident: 'int32',
                                            format: 'int32'
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        });
        const data = {
            l : 'hi',
            c : {
                l2 : 32
            }
        };
        const b = new node.Browser(m, nodes.reflect({obj: data}));
        const copy = {};
        b.Root().insertInto(nodes.reflect({obj: copy}));
        console.log(JSON.stringify(copy));
    });
});

