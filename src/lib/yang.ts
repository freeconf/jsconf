
import * as meta from './meta.js';
import * as schema from './schema.js';
import * as src from './src';

console.log('yang.ts');

export function load(src: src.Source, name: string): meta.Module {
    const b = src.load(name, '.yang');
    return schema.load(JSON.parse(b.toString()));
}