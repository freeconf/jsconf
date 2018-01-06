import * as meta from './meta.js';
import * as node from './node.js';
import * as val from './val.js';

console.log('nodes.ts');

export interface OnChild {
    (r: node.ChildRequest): (node.Node|null);
}

export interface OnField {
    (r: node.FieldRequest, hnd: node.ValueHandle): void;
}

export interface OnNext {
    (r: node.ListRequest): ({n: node.Node; key: val.Value[]} | null);
}

export interface OnChoose {
    (r: node.Selection, c: meta.Choice): meta.ChoiceCase;
}

export interface OnDelete {
    (r: node.NodeRequest): void;
}

export interface OnBeginEdit {
    (r: node.NodeRequest): void;
}

export interface OnEndEdit {
    (r: node.NodeRequest): void;
}

export interface OnAction {
    (r: node.ActionRequest): (node.Node|null);
}

export interface OnNotify {
    (r: node.NotifyRequest): (node.NotifyCloser|null);
}

export interface OnPeek {
    (s: node.Selection, consumer: any): (any|null);
}

export interface OnContext {
    (s: node.Selection, ctx: Map<string, any>): Map<string, any>;
}

export class Basic {
    peekable?: any;
    onChild?: OnChild;
    onField?: OnField;
    onNext?: OnNext;
    onChoose?: OnChoose;
    onDelete?: OnDelete;
    onBeginEdit?: OnBeginEdit;
    onEndEdit?: OnEndEdit;
    onAction?: OnAction;
    onNotify?: OnNotify;
    onPeek?: OnPeek;
    onContext?: OnContext;
}

export function basic(self: Basic): node.Node {
    return {
        child(r: node.ChildRequest): (node.Node|null) {
            if (self.onChild == null) {
                throw new Error('Child not implemented on node ' + r.selection.path);
            }
            return self.onChild(r);
        },

        field(r: node.FieldRequest, hnd: node.ValueHandle) {
            if (self.onField == null) {
                throw new Error('Field not implemented on node ' + r.selection.path);
            }
            return self.onField(r, hnd);
        },

        next(r: node.ListRequest): ({n: node.Node; key: val.Value[]} | null) {
            if (self.onNext == null) {
                throw new Error('Next not implemented on node ' + r.selection.path);
            }
            return self.onNext(r);
        },

        choose(sel: node.Selection, choice: meta.Choice): meta.ChoiceCase {
            if (self.onChoose == null) {
                throw new Error('Choose not implemented on node ' + sel.path);
            }
            return self.onChoose(sel, choice);
        },

        remove(r: node.NodeRequest) {
            if (self.onDelete == null) {
                throw new Error('Delete not implemented on node ' + r.selection.path);
            }
            return self.onDelete(r);
        },

        beginEdit(r: node.NodeRequest) {
            if (self.onBeginEdit == null) {
                return;
            }
            return self.onBeginEdit(r);
        },

        endEdit(r: node.NodeRequest) {
            if (self.onEndEdit == null) {
                return;
            }
            return self.onEndEdit(r);
        },

        action(r: node.ActionRequest): (node.Node|null) {
            if (self.onAction == null) {
                throw new Error('Action not implemented on node ' + r.selection.path);
            }
            return self.onAction(r);
        },

        notify(r: node.NotifyRequest): (node.NotifyCloser|null) {
            if (self.onNotify == null) {
                throw new Error('Action not implemented on node ' + r.selection.path);
            }
            return self.onNotify(r);
        },

        peek(s: node.Selection, consumer: any): (any|null) {
            if (self.onPeek == null) {
                return self.peekable;
            }
            return self.onPeek(s, consumer);
        },

        context(s: node.Selection, ctx: Map<string, any>): Map<string, any> {
            if (self.onContext == null) {
                return ctx;
            }
            return self.onContext(s, ctx);
        }
    };
}


export class Extend {
    base: node.Node;
    onChild?: OnExtendChild;
    onField?: OnExtendField;
    onNext?: OnExtendNext;
    onChoose?: OnExtendChoose;
    onDelete?: OnExtendDelete;
    onBeginEdit?: OnExtendBeginEdit;
    onEndEdit?: OnExtendEndEdit;
    onAction?: OnExtendAction;
    onNotify?: OnExtendNotify;
    onPeek?: OnExtendPeek;
    onContext?: OnExtendContext;
}

export function extend(self: Extend): node.Node {
    return {
        child(r: node.ChildRequest): (node.Node|null) {
            if (self.onChild == null) {
                return self.base.child(r);
            }
            return self.onChild(self.base, r);
        },

        field(r: node.FieldRequest, hnd: node.ValueHandle) {
            if (self.onField == null) {
                self.base.field(r, hnd);
            } else {
                self.onField(self.base, r, hnd);
            }
        },

        next(r: node.ListRequest): ({n: node.Node; key: val.Value[]}|null) {
            if (self.onNext == null) {
                return self.base.next(r);
            }
            return self.onNext(self.base, r);
        },

        choose(sel: node.Selection, choice: meta.Choice): meta.ChoiceCase {
            if (self.onChoose == null) {
                return self.base.choose(sel, choice);
            }
            return self.onChoose(self.base, sel, choice);
        },

        remove(r: node.NodeRequest) {
            if (self.onDelete == null) {
                self.base.remove(r);
            } else {
                self.onDelete(self.base, r);
            }
        },

        beginEdit(r: node.NodeRequest) {
            if (self.onBeginEdit == null) {
                self.base.beginEdit(r);
            } else {
                self.onBeginEdit(self.base, r);
            }
        },

        endEdit(r: node.NodeRequest) {
            if (self.onEndEdit == null) {
                self.base.endEdit(r);
            } else {
                self.onEndEdit(self.base, r);
            }
        },

        action(r: node.ActionRequest): (node.Node|null) {
            if (self.onAction == null) {
                throw new Error('Action not implemented on node ' + r.selection.path);
            }
            return self.onAction(self.base, r);
        },

        notify(r: node.NotifyRequest): (node.NotifyCloser|null) {
            if (self.onNotify == null) {
                throw new Error('Action not implemented on node ' + r.selection.path);
            }
            return self.onNotify(self.base, r);
        },

        peek(s: node.Selection, consumer: any): (any|null) {
            if (self.onPeek == null) {
                return self.base.peek(s, consumer);
            }
            return self.onPeek(self.base, s, consumer);
        },

        context(s: node.Selection, ctx: Map<string, any>): Map<string, any> {
            if (self.onContext == null) {
                return ctx;
            }
            return self.onContext(self.base, s, ctx);
        }
    };
}

export interface OnExtendChild {
    (parent: node.Node, r: node.ChildRequest): (node.Node|null);
}

export interface OnExtendField {
    (parent: node.Node, r: node.FieldRequest, hnd: node.ValueHandle): void;
}

export interface OnExtendNext {
    (parent: node.Node, r: node.ListRequest): ({n: node.Node; key: val.Value[]}|null);
}

export interface OnExtendChoose {
    (parent: node.Node, r: node.Selection, c: meta.Choice): meta.ChoiceCase;
}

export interface OnExtendDelete {
    (parent: node.Node, r: node.NodeRequest): void;
}

export interface OnExtendBeginEdit {
    (parent: node.Node, r: node.NodeRequest): void;
}

export interface OnExtendEndEdit {
    (parent: node.Node, r: node.NodeRequest): void;
}

export interface OnExtendAction {
    (parent: node.Node, r: node.ActionRequest): (node.Node|null);
}

export interface OnExtendNotify {
    (parent: node.Node, r: node.NotifyRequest): (node.NotifyCloser|null);
}

export interface OnExtendPeek {
    (parent: node.Node, s: node.Selection, consumer: any): (any|null);
}

export interface OnExtendContext {
    (parent: node.Node, s: node.Selection, ctx: Map<string, any>): Map<string, any>;
}

export class Reflect {
    obj: any;
    onCreate?: () => any;
}

export function reflect(self: Reflect): node.Node {
    return reflectChildObject(self);
}

export function reflectList(self: Reflect): node.Node {
    if (self.obj instanceof Map) {
        return reflectListMap(self, self.obj as Map<any, any>);
    } else if (self.obj instanceof Array) {
        return reflectListArray(self, self.obj as any[]);
    }
    throw new Error('unsupported list type ' + self.obj);
}

function reflectChildObject(self: Reflect): node.Node {
    return basic({
        peekable: self.obj,
        onChoose: function(sel: node.Selection, choice: meta.Choice): meta.ChoiceCase {
            for (const [_, kase] of choice.cases) {
                for (const d of kase.dataDef) {
                    if (reflectProp(self.obj, d.ident) != null) {
                        return kase;
                    }
                }
            }
            throw new Error('not enough data to determine choice case ' + sel.path);
        },
        onChild: function(r: node.ChildRequest): (node.Node | null) {
            const prop = Object.getOwnPropertyDescriptor(self.obj, r.meta.ident);
            let val: any;
            if (r.create) {
                val = reflectCreate(self);
                if (prop === undefined) {
                    self.obj[r.meta.ident] = val;
                } else {
                    prop.value = val;
                }
            } else {
                if (prop === undefined) {
                    return null;
                }
                val = prop.value;
            }
            if (val === null) {
                return null;
            }
            if (r.meta instanceof meta.List) {
                return reflectList({obj: val, onCreate: self.onCreate});
            }
            return reflect({obj: val, onCreate: self.onCreate});
        },
        onField: function(r: node.FieldRequest, hnd: node.ValueHandle) {
            const prop = Object.getOwnPropertyDescriptor(self.obj, r.meta.ident);
            if (r.write) {
                if (prop === undefined) {
                    self.obj[r.meta.ident] = hnd.val.val;
                } else {
                    // TODO: handle enums, test if destination is string or
                    // number or enum (if this is even possible in TS)
                    prop.value = hnd.val.val;
                }
            } else {
                if (prop !== undefined) {
                    hnd.val = node.value(r.meta, prop.value);
                }
            }
        }
    });
}

function reflectCreate(self: Reflect): any {
    if (self.onCreate == null) {
        return {};
    }
    return self.onCreate();
}

function reflectProp(item: any, ident: string): any {
    const d = Object.getOwnPropertyDescriptor(item, ident);
    if (d != null) {
        return d.value;
    }
    return null;
}

function reflectListMap(self: Reflect, x: Map<any, any>): node.Node {
    const i = index(x);
    return basic({
        peekable: x,
        onNext: function(r: node.ListRequest): ({n: node.Node; key: val.Value[]} | null) {
            let item: any;
            let key = r.key;
            if (r.create) {
                item = reflectCreate(self);
                if (key == null) {
                    throw new Error('no key defined for ' + r.selection.path);
                }
                x.set(key[0].val, item);
            } else if (key != null) {
                item = x.get(key[0]);
            } else {
                if (r.row < i.length) {
                    item = i[r.row];
                    const keyVal = reflectProp(item, r.meta.key[0]);
                    key = node.values(r.meta.keyMeta, keyVal);
                }
            }
            if (item != null) {
                const n = reflect({obj: item, onCreate: self.onCreate});
                if (n === undefined || key === undefined) {
                    throw new Error('illegal state');
                }
                return {n: n, key: key};
            }
            return null;
        }
    });
}

function reflectListArray(self: Reflect, x: any[]): node.Node {
    return basic({
        peekable: x,
        onNext: function(r: node.ListRequest): ({n: node.Node; key: val.Value[]}|null) {
            let item: any;
            let key = r.key;
            if (r.create) {
                item = reflectCreate(self);
                if (key === null) {
                    throw new Error('no key defined for ' + r.selection.path);
                }
                x.push(item);
            } else if (key != null) {
                // possible to do, just not implemented
                throw new Error('cannot lookup by key in array ' + r.selection.path);
            } else if (r.row < x.length) {
                item = x[r.row];
                const keyVal = reflectProp(item, r.meta.key[0]);
                key = node.values(r.meta.keyMeta, keyVal);
            }
            if (item !== null) {
                const n = reflect({obj: item, onCreate: self.onCreate});
                if (n === undefined || key === undefined) {
                    throw new Error('illegal state');
                }
                return {n: n, key: key};
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
