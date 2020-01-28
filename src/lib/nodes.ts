



import * as reflect from './nodes/reflect';
import * as node from './node';


export async function toJson(s: node.Selection): Promise<string> {
    const data = {};
    await s.insertInto(reflect.node(data));
    return JSON.stringify(data);
}

export function index<K, V>(m: Map<K, V>): K[] {
    const keys: K[] = new Array(m.size);
    let i = 0;
    for (const k of m.keys()) {
        keys[i++] = k;
    }
    return keys;
}
