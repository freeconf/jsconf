
import * as device from './device.js';
import * as node from './node.js';
import * as reflect from './nodes/reflect.js';
import * as meta from './meta.js';
import * as src from './src.js';
import * as yang from './yang.js';

console.log("bird.ts");

export async function create(ypath: src.Source): Promise<device.Device> {
    const m = await yang.load(ypath, "bird");
    const mods = new Map<string, meta.Module>();
    const n = reflect.node({obj: {
        bird : [{
            name : "bluejay",
            wingspan: 10,
            species : {
                name : "jay"
            }
        }]
    }});
    mods.set(m.ident, m);
    return {
        modules: mods,
        browser: (_: string) => {
            return new node.Browser(m, n);
        }
    };
}