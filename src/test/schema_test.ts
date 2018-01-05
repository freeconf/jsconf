/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />

import * as meta from '../lib/meta.js';
import * as schema from '../lib/schema.js';
import * as val from '../lib/val.js';
import * as node from '../lib/node.js';
import * as nodes from '../lib/nodes.js';
import { yangModule } from '../lib/schema.js';

suite('freeconf', () => {
    suite('schema', () => {        

        test('yang', () => {
            let m = yangModule();
            assert.equal("yang", m.ident);
            let mdef = m.definition("module") as meta.Container;
            let ddef = mdef.definition("dataDef") as meta.List;
            let ldef = ddef.definition("leaf") as meta.Container;
            assert.equal(5, ldef.dataDef.length);
        });

        test('load', () => {
            let m = schema.load({
                module: {
                    ident: "x",
                    dataDef: [
                        {
                            ident: "l",
                            leaf: {
                                type: {
                                    ident: "string",
                                    format: "string"
                                }
                            }
                        }, {
                            ident: "c",
                            container: {
                                dataDef: [
                                    {
                                        ident: "l2",
                                        leaf: {
                                            type: {
                                                ident: "int32",
                                                format: "int32"
                                            }    
                                        }
                                    }
                                ]
                            }                            
                        }
                    ]
                }
            });
            assert.equal("x", m.ident);
            assert.equal(2, m.dataDef.length);
            let l = (m.dataDef[0] as meta.Leaf);
            assert.equal("l", l.ident);
            console.log(l.type);
            assert.equal(val.Format.Str, l.type.format);
            let c = (m.dataDef[1] as meta.Container);
            assert.equal("c", c.ident);
        });

        test('rw', () => {
            let m = schema.load({
                module: {
                    ident: "x",
                    dataDef: [
                        {
                            ident: "l",
                            leaf: {
                                type: {
                                    ident: "string",
                                    format: "string"
                                }
                            }
                        }, {
                            ident: "c",
                            container: {
                                dataDef: [
                                    {
                                        ident: "l2",
                                        leaf: {
                                            type: {
                                                ident: "int32",
                                                format: "int32"
                                            }    
                                        }
                                    }
                                ]
                            }                            
                        }
                    ]
                }
            });
            let data = {
                l : "hi",
                c : {
                    l2 : 32
                }
            }
            let b = new node.Browser(m, nodes.reflect({obj:data}));
            let copy = {};
            b.Root().insertInto(nodes.reflect({obj:copy}));
            console.log(JSON.stringify(copy));
        });
    });
});

