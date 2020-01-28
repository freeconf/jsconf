
import * as nodes from '../nodes';
import * as reflect from './reflect';
import * as schema from './schema';
import * as node from '../node';
import { expect } from 'chai';
import 'mocha';

describe('reflect', () => {
    it('write', async () => {
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
        expect(actual).to.equal('{"l":[{"id":"x"}]}');
    });
});

