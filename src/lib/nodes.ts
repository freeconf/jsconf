



import * as reflect from './nodes/reflect.js';
import * as node from './node.js';


export async function toJson(s: node.Selection): Promise<string> {
    const data = {};
    await s.insertInto(reflect.node({obj: data}));
    return JSON.stringify(data);
}