
import * as meta from '../meta';
import * as schema from './schema';
import * as val from '../val';
import * as node from '../node';
import * as reflect from './reflect';
import { yangModule } from './schema';
import { expect } from 'chai';
import 'mocha';

describe('schema', () => {

    it('yang', () => {
        const m = yangModule();
        expect(m.ident).to.equal('yang');
        const mdef = m.definition('module') as meta.Container;
        const ddef = mdef.definition('dataDef') as meta.List;
        const ldef = ddef.definition('leaf') as meta.Container;
        expect(ldef.dataDef.length).to.equal(5);
    });

    it('load', async () => {
        const m = await schema.load({
            module: {
                ident: 'm',
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
        expect(m.ident).to.equal('m');
        expect(m.dataDef.length).to.equal(2);
        const l = (m.dataDef[0] as meta.Leaf);
        expect( l.ident).to.equal('l');
        console.log(l.type);
        expect(l.type.format).to.equal(val.Format.Str);
        const c = (m.dataDef[1] as meta.Container);
        expect(c.ident).to.equal('c');
    });

    it('rw', async () => {
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
        const b = new node.Browser(m, reflect.node(data));
        const copy = {};
        b.Root().insertInto(reflect.node(copy));
        console.log(JSON.stringify(copy));
    });
});

