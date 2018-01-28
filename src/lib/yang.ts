
import * as meta from './meta.js';
import * as schema from './schema.js';
import * as src from './src';

console.log('yang.ts');

export async function load(src: src.Source, name: string): Promise<meta.Module> {
    const b = src.load(name, '.yang');
    return await schema.load(JSON.parse(b.toString()));
}