
import * as meta from './meta';
import * as schema from './nodes/schema';
import {Source, arrayBuffer2Str} from './src';

console.log('yang.ts');

export async function load(s: Source, name: string): Promise<meta.Module> {
    // because we cannot parse yang files directly, we look for yang as
    // json files converted using fc-doc command or web request to 
    // https://{server}/restconf/schema/
    const b = await s.load(name, '.json');
    const obj = JSON.parse(arrayBuffer2Str(b));
    return await schema.load(obj);
}