
import * as d from './device';
import * as node from './node';
import * as reflect from './nodes/reflect';
import * as meta from './meta';
import * as src from './src';
import * as yang from './yang';

console.log("bird.ts");

export async function browser(ypath: src.Source, data?: any): Promise<node.Browser> {
    if (data === undefined) {
        data = {
            bird : [{
                name : "bluejay",
                wingspan: 10,
                species : {
                    name : "jay"
                }
            }]
        };
    }
    const m = await yang.load(ypath, "bird");
    return new node.Browser(m, reflect.node(data));
}

export function device(b: node.Browser): d.Device {
    const mods = new Map<string, meta.Module>();
    mods.set(b.meta.ident, b.meta);
    return {
        modules: mods,
        browser: (_: string) => {
            return b;
        }
    };
}