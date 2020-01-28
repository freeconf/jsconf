import * as src from './src';
import * as bird from './bird';
import * as nodes from './nodes';
import { expect } from 'chai';
import 'mocha';

describe('device', () => {
    it('bird', async () => {
        const ypath = src.dir("./src/lib/testdata/yang");
        const d = bird.device(await bird.browser(ypath));
        const actual = await nodes.toJson(d.browser("bird").Root());
        const expected = '{"bird":[{"name":"bluejay","wingspan":10,"species":{"name":"jay"}}]}';
        expect(actual).to.equal(expected);
    });
});
