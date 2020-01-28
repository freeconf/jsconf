import { expect } from 'chai';
import 'mocha';
import * as src from './src';

describe('loading data', () => {

    it('from web', async () =>  {
        let s = src.web('https://raw.githubusercontent.com/freeconf/jsconf/master');
        let buff = await s.load('README', '.md');
        expect(buff).to.be.not.null;
    });

    it('from dir', async () => {
        const b = src.dir('./src/lib/testdata/dir');
        const found = src.arrayBuffer2Str(await b.load('hello', '.txt'));
        expect(found.toString()).to.equal('hello');
    });
});
