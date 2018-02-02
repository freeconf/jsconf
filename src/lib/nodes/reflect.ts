import * as meta from '../meta.js';
import * as n from '../node.js';
import * as basic from './basic.js';

console.log('reflect.ts');

export class Reflect {
    obj: any;
    onCreateChild?: (s: n.Selection, m: meta.Meta, self: Reflect) => any;
    onCreateListItem?: (s: n.Selection, m: meta.Meta, self: Reflect) => any;
}

export function node(self: Reflect): n.Node {
    return child(self);
}

export function reflectList(self: Reflect): n.Node {
    if (self.obj instanceof Map) {
        return listMap(self, self.obj as Map<any, any>);
    } else if (self.obj instanceof Array) {
        return listArray(self, self.obj as any[]);
    }
    throw new Error('unsupported list type ' + self.obj);
}

function child(self: Reflect): n.Node {
    return basic.node({
        peekable: self.obj,
        onChoose: function(sel: n.Selection, choice: meta.Choice) {
            for (const [_, kase] of choice.cases) {
                for (const d of kase.dataDef) {
                    if (reflectProp(self.obj, d.ident) != null) {
                        return kase;
                    }
                }
            }
            throw new Error('not enough data to determine choice case ' + sel.path);
        },
        onChild: function(r: n.ChildRequest) {
            let val: any;
            if (r.create) {
                val = createChild(r.selection, r.meta, self);
                self.obj[r.meta.ident] = val;
            } else {
                val = self.obj[r.meta.ident];
            }
            if (val === null || val === undefined) {
                return null;
            }
            if (r.meta instanceof meta.List) {
                return reflectList({...self, obj: val});
            }
            return node({...self, obj: val});
        },
        onField: function(r: n.FieldRequest, hnd: n.ValueHandle) {
            if (r.write) {
                self.obj[r.meta.ident] = hnd.val.val;
            } else {
                hnd.val = n.value(r.meta, self.obj[r.meta.ident]);
            }
        }
    });
}

function createChild(s: n.Selection, m: meta.Meta, self: Reflect): any {
    if (self.onCreateChild == null) {
        // TODO: decide which is best default : Map or [] or {}
        if (m instanceof meta.List) {
            return [];
        }
        return {};
    }
    return self.onCreateChild(s, m, self);
}

function createListItem(s: n.Selection, m: meta.Meta, self: Reflect): any {
    if (self.onCreateListItem == null) {
        return {};
    }
    return self.onCreateListItem(s, m, self);
}

function reflectProp(item: any, ident: string): any {
    const d = Object.getOwnPropertyDescriptor(item, ident);
    if (d != null) {
        return d.value;
    }
    return null;
}

function listMap(self: Reflect, x: Map<any, any>): n.Node {
    const i = index(x);
    return basic.node({
        peekable: x,
        onNext: function(r: n.ListRequest): n.ListResponse {
            let item: any;
            let key = r.key;
            if (r.create) {
                item = createListItem(r.selection, r.meta, self);
                if (key == null) {
                    throw new Error('no key defined for ' + r.selection.path);
                }
                x.set(key[0].val, item);
            } else if (key != null) {
                item = x.get(key[0]);
            } else {
                if (r.row < i.length) {
                    item = i[r.row];
                    if (r.meta.keyMeta) {
                        const keyVal = reflectProp(item, r.meta.key[0]);
                        key = n.values(r.meta.keyMeta, keyVal);    
                    }
                }
            }
            if (item !== undefined) {
                const n = node({...self, obj: item});
                // if (n === undefined || key === undefined) {
                //     throw new Error('illegal state');
                // }
                return [n, key];
            }
            return null;
        }
    });
}

function listArray(self: Reflect, x: any[]): n.Node {
    return basic.node({
        peekable: x,
        onNext: function(r: n.ListRequest): n.ListResponse {
            let item: any;
            let key = r.key;
            if (r.create) {
                item = createListItem(r.selection, r.meta, self);
                x.push(item);
            } else if (key != null) {
                for (let i = 0; i < x.length; i++) {
                    if (x[i][r.meta.key[0]] == key[0].val) {
                        item = x[i];
                        break;
                    }
                }
            } else if (r.row < x.length) {
                item = x[r.row];
                const keyVal = reflectProp(item, r.meta.key[0]);
                key = n.values(r.meta.keyMeta, keyVal);
            }
            if (item !== undefined) {
                const n = node({...self, obj: item});
                if (n === undefined) {
                    throw new Error('illegal state');
                }
                return [n, key];
            }
            return null;
        }
    });
}

export function index<K, V>(m: Map<K, V>): K[] {
    const keys: K[] = new Array(m.size);
    let i = 0;
    for (const k of m.keys()) {
        keys[i++] = k;
    }
    return keys;
}