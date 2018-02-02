
import * as meta from './meta.js';
import * as schema from './nodes/schema.js';
import * as src from './src.js';

console.log('yang.ts');

async function blobAsJson(b: Blob): Promise<any> {
    return new Promise((resolve, reject) => {
        const rdr = new FileReader();
        rdr.addEventListener("loadend", () => {            
            resolve(JSON.parse(rdr.result));
        });
        rdr.addEventListener("error", (err) => {
            reject(err);
        })
        rdr.readAsText(b);            
    });
}

export async function load(s: src.Source, name: string): Promise<meta.Module> {
    const b = await s.load(name, '.yang');
    const obj = await blobAsJson(b);
    return await schema.load(obj);
}