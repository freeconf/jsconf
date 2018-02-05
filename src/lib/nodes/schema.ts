
import * as node from '../node.js';
import * as basic from './basic.js';
import * as extend from './extend.js';
import * as reflect from './reflect.js';
import * as nodes from '../nodes.js';
import * as meta from '../meta.js';
import * as val from '../val.js';

console.log('schema.ts');

export async function load(data: any): Promise<meta.Module> {
    const m = new meta.Module('');
    const b = new node.Browser(yangModule(), schemaNode(m));
    await b.Root().upsertFrom(reflect.node(data));
    return m;
}

export function schemaNode(m: meta.Module): node.Node {
    return basic.node({
        peekable: m,
        onChild: function(r: node.ChildRequest) {
            switch (r.meta.ident) {
            case 'module':
                return moduleNode(m);
            }
            return null;
        }
    });
}

function metaNode(m: meta.Meta): node.Node {
    // ident, description, reference
    return reflect.node(m);
}

function definitionNode(m: meta.Definition): node.Node {
    return extend.node({
        base: metaNode(m),
        onChild: function(base: node.Node, r: node.ChildRequest) {
            switch (r.meta.ident) {
            case 'action':
                const ha: meta.HasActions = (m as meta.HasActions);
                if (ha.actions.size > 0 || r.create) {
                    return actionsNode(ha, ha.actions);
                }
                break;
            case 'notify':
                const hn: meta.HasNotifications = (m as meta.HasNotifications);
                if (hn.notifys.size > 0 || r.create) {
                    return notifysNode(hn, hn.notifys);
                }
                break;
            case 'dataDef':
                const n: meta.Nodeable = (m as meta.Nodeable);
                if (n.dataDef.length > 0 || r.create) {
                    return dataDefsNode(n, n.dataDef);
                }
                break;
            default:
                return base.child(r);
            }
            return null;
        }
    });
}

function actionNode(action: meta.Action): node.Node {
    return extend.node({
        base: metaNode(action),
        onChild: function(_: node.Node, r: node.ChildRequest) {
            switch (r.meta.ident) {
            case 'input':
                if (r.create) {
                    action.input = new meta.RpcInput(action);
                }
                if (action.input != null) {
                    return metaNode(action.input);
                }
                break;
            case 'output':
                if (r.create) {
                    action.output = new meta.RpcOutput(action);
                }
                if (action.output != null) {
                    return metaNode(action.output);
                }
                break;
            }
            return null;
        }
    });
}

function choiceNode(c: meta.Choice): node.Node {
    return extend.node({
        base: definitionNode(c),
        onChild: function(p: node.Node, r: node.ChildRequest) {
            switch (r.meta.ident) {
            case 'cases':

            default:
                return p.child(r);
            }
        }
    });
}

function nodeableNode(l: meta.Nodeable): node.Node {
    return extend.node({
        base: definitionNode(l),
    });
}

function typeNode(t: meta.Type): node.Node {
    return extend.node({
        base: reflect.node(t),
        onField: function(p: node.Node, r: node.FieldRequest, hnd: node.ValueHandle) {
            switch (r.meta.ident) {
            case 'format':
                if (r.write) {
                    t.format = (hnd.val.val as val.Enum).id as val.Format;
                } else {
                    hnd.val = {val: types.byId(t.format), format: val.Format.Enum};
                }
                break;
            default:
                return p.field(r, hnd);
            }
        }
    });
}

function leafyNode(d: meta.Leafable): node.Node {
    return extend.node({
        base: definitionNode(d),
        onChild: function(p: node.Node, r: node.ChildRequest) {
            switch (r.meta.ident) {
            case 'type':
                if (r.create) {
                    d.type = new meta.Type();
                }
                if (d.type != null) {
                    return typeNode(d.type);
                }
                break;
            default:
                return p.child(r);
            }
            return null;
        }
    });
}

function dataDefNode(d: meta.Definition): node.Node {
    return extend.node({
        base: definitionNode(d),
        onChild: function(p: node.Node, r: node.ChildRequest) {
            switch (r.meta.ident) {
            case 'leaf':
            case 'leaf-list':
            case 'anyxml':
                return leafyNode(d as meta.Leafable);
            case 'container':
            case 'list':
                return nodeableNode(d as meta.Nodeable);
            case 'choice':
                return choiceNode(d as meta.Choice);
            default:
                return p.child(r);
            }
        }
    });
}

function notifyNode(notify: meta.Notification): node.Node {
    return extend.node({
        base: metaNode(notify)
    });
}

function dataDefsNode(parent: meta.Nodeable, defs: meta.Definition[]): node.Node {
    return basic.node({
        peekable: defs,
        onNext: function(r: node.ListRequest) {
            let key = r.key;
            let a: meta.Definition | undefined;
            if (key !== undefined) {
                if (r.create && r.from !== undefined) {
                    const kase = r.from.node.choose(r.selection, r.meta.choice('body-stmt'));
                    a = createDefinition(parent, kase.ident, key[0].val as string);
                    defs.push(a);
                } else {
                    const ident = key[0].val as string;
                    a = defs.find((d) => d.ident === ident);
                }
            } else if (r.row < defs.length) {
                a = defs[r.row];
                key = [val.str(a.ident)];
            }
            if (a !== undefined) {
                return [dataDefNode(a), key];
            }
            return null;
        }
    });
}

function createDefinition(parent: meta.Nodeable, metaType: string, ident: string): meta.Definition {
    switch (metaType) {
    case 'container':
        return new meta.Container(parent, ident);
    case 'leaf':
        return new meta.Leaf(parent, ident);
    case 'leaf-list':
        return new meta.LeafList(parent, ident);
    case 'list':
        return new meta.List(parent, ident);
    case 'choice':
        return new meta.Choice(parent, ident);
    case 'anyxml':
        return new meta.Any(parent, ident);
    }
    throw new Error('unrecognized type ' + metaType);
}

function actionsNode(parent: meta.Nodeable, actions: Map<string, meta.Action>): node.Node {
    const keys = nodes.index(actions);
    return basic.node({
        peekable: actions,
        onNext: function(r: node.ListRequest) {
            let key = r.key;
            let a: meta.Action|undefined;
            if (key != null) {
                const ident = key[0].val as string;
                if (r.create) {
                    a = new meta.Action(parent, ident);
                    actions.set(ident, a);
                } else {
                    a = actions.get(ident);
                }
            } else if (r.row < actions.size) {
                a = actions.get(keys[r.row]) as meta.Action;
                key = [val.str(a.ident)];
            }
            if (a != null) {
                if (key == null) {
                    throw new Error('illegal state');
                }
                return [actionNode(a), key];
            }
            return null;
        }
    });
}

function notifysNode(parent: meta.Nodeable, notifys: Map<string, meta.Notification>): node.Node {
    const keys = nodes.index(notifys);
    return basic.node({
        peekable: notifys,
        onNext: function(r: node.ListRequest) {
            let key = r.key;
            let x: meta.Notification|undefined;
            if (key != null) {
                const ident = key[0].val as string;
                if (r.create) {
                    x = new meta.Notification(parent, ident);
                    notifys.set(ident, x);
                } else {
                    x = notifys.get(key[0].val as string);
                }
            } else if (r.row < notifys.size) {
                x = notifys.get(keys[r.row]) as meta.Notification;
                key = [val.str(x.ident)];
            }
            if (x != null) {
                if (key == null) {
                    throw new Error('illegal state');
                }
                return [notifyNode(x), key];
            }
            return null;
        }
    });
}

function moduleNode(m: meta.Module): node.Node {
    return extend.node({
        base: definitionNode(m),
        onChild: function(p: node.Node, r: node.ChildRequest) {
            switch (r.meta.ident) {
            case 'revision':
                if (r.create) {
                    m.revision = {};
                }
                if (m.revision != null) {
                    return reflect.node(m.revision);
                }
                break;
            default:
                return p.child(r);
            }
            return null;
        }
    });
}

// rendition of what's in goconf/yang/yang.yang
//

export function yangModule(): meta.Module {
    const m = new meta.Module('yang');
    const c = new meta.Container(m, 'module');
    m.dataDef.push(c);
    c.dataDef.push(...headerDefs(c));
    const ns = new meta.Leaf(c, 'namespace');
    ns.type = ({format: val.Format.Str} as meta.Type);
    c.dataDef.push(ns);
    c.dataDef.push(...actionsAndNotifysDefs(c));
    c.dataDef.push(dataDef(c));
    return m;
}

function detailsDef(parent: meta.Meta): meta.Definition[] {
    const cfg = new meta.Leaf(parent, 'config');
    cfg.type = ({format: val.Format.Boolean} as meta.Type);
    const mandatory = new meta.Leaf(parent, 'mandatory');
    mandatory.type = ({format: val.Format.Boolean} as meta.Type);
    return [cfg, mandatory];
}

function typeDef(parent: meta.Meta): meta.Definition {
    const c = new meta.Container(parent, 'type');
    c.dataDef.push(...typeDetailsDef(c));
    return c;
}

const types = new val.EnumList([
    {id: val.Format.Binary, label: 'binary'},
    {id: val.Format.Bits, label: 'bits'},
    {id: val.Format.Boolean, label: 'boolean'},
    {id: val.Format.Decimal64, label: 'decimal64'},
    {id: val.Format.Empty, label: 'empty'},
    {id: val.Format.Enum, label: 'enum'},
    {id: val.Format.IdentityRef, label: 'identityRef'},
    {id: val.Format.InstanceRef, label: 'instanceRef'},
    {id: val.Format.Int8, label: 'int8'},
    {id: val.Format.Int16, label: 'int16'},
    {id: val.Format.Int32, label: 'int32'},
    {id: val.Format.Int64, label: 'int64'},
    {id: val.Format.LeafRef, label: 'leafRef'},
    {id: val.Format.Str, label: 'string'},
    {id: val.Format.UInt8, label: 'uint8'},
    {id: val.Format.UInt16, label: 'uint16'},
    {id: val.Format.UInt32, label: 'uint32'},
    {id: val.Format.UInt64, label: 'uint64'},
    {id: val.Format.Union, label: 'union'},
    {id: val.Format.Any, label: 'any'},
    {id: val.Format.BinaryList, label: 'binaryList'},
    {id: val.Format.BitsList, label: 'bitsList'},
    {id: val.Format.BooleanList, label: 'boolenaList'},
    {id: val.Format.Decimal64List, label: 'decimal64List'},
    {id: val.Format.EmptyList, label: 'emptyList'},
    {id: val.Format.EnumList, label: 'enumList'},
    {id: val.Format.IdentityRefList, label: 'identityRefList'},
    {id: val.Format.InstanceRefList, label: 'instanceRefList'},
    {id: val.Format.Int8List, label: 'int8List'},
    {id: val.Format.Int16List, label: 'int16List'},
    {id: val.Format.Int32List, label: 'int32List'},
    {id: val.Format.Int64List, label: 'int64List'},
    {id: val.Format.LeafRefList, label: 'leafRefList'},
    {id: val.Format.StrList, label: 'stringList'},
    {id: val.Format.UInt8List, label: 'uint8List'},
    {id: val.Format.UInt16List, label: 'uint16List'},
    {id: val.Format.UInt32List, label: 'uint32List'},
    {id: val.Format.UInt64List, label: 'uint64List'},
    {id: val.Format.UnionList, label: 'unionList'},
    {id: val.Format.AnyList, label: 'anyList'}
]);

function typeDetailsDef(c: meta.Container): meta.Definition[] {
    const dataDefs = headerDefs(c);
    const t = new meta.Container(c, 'type');
    dataDefs.push(t);
    const f = new meta.Leaf(t, 'format');
    dataDefs.push(f);
    f.type = ({format: val.Format.Enum} as meta.Type);
    f.type.enum = types;
    // TODO: range, enumeration, path, base, union, length,
    // fractionDigits, pattern
    return dataDefs;
}

function unitsDef(c: meta.Container): meta.Definition {
    const l = new meta.Leaf(c, 'units');
    l.type = ({format: val.Format.Str} as meta.Type);
    return c;
}

function mustDef(c: meta.Container): meta.Definition {
    const l = new meta.Leaf(c, 'must');
    l.type = ({format: val.Format.Str} as meta.Type);
    return c;
}

function listDetailsDefs(c: meta.Container): meta.Definition[] {
    const min = new meta.Leaf(c, 'minElements');
    min.type = ({format: val.Format.Int32} as meta.Type);
    const max = new meta.Leaf(c, 'maxElements');
    max.type = ({format: val.Format.Int32} as meta.Type);
    const ub = new meta.Leaf(c, 'unbounded');
    ub.type = ({format: val.Format.Boolean} as meta.Type);
    return [min, max, ub];
}

function dataDef(parent: meta.Meta): meta.List {
    const ddef = new meta.List(parent, 'dataDef');
    ddef.key = ['ident'];
    ddef.dataDef.push(...headerDefs(ddef));
    ddef.dataDef.push(whenDef(ddef));
    const bodyStmt = new meta.Choice(ddef, 'body-stmt');
    ddef.dataDef.push(bodyStmt);

    for (const ident of ['container', 'list', 'leaf', 'anyxml', 'leaf-list', 'choice']) {
        const kase = new meta.ChoiceCase(bodyStmt, ident);
        bodyStmt.cases.set(kase.ident, kase);
        const d = new meta.Container(kase, kase.ident);
        kase.dataDef.push(d);

        switch (ident) {
        case 'container':
            d.dataDef.push(ddef); // recursive definition
            d.dataDef.push(...detailsDef(d));
            d.dataDef.push(...actionsAndNotifysDefs(d));
            break;

        case 'list':
            d.dataDef.push(ddef); // recursive definition
            d.dataDef.push(...detailsDef(d));
            const key = new meta.LeafList(d, 'key');
            key.type = {format: val.Format.StrList} as meta.Type;
            d.dataDef.push(key);
            d.dataDef.push(...listDetailsDefs(d));
            d.dataDef.push(...actionsAndNotifysDefs(d));
            break;

        case 'anyxml':
            d.dataDef.push(...detailsDef(d));
            d.dataDef.push(typeDef(d));
            break;

        case 'leaf':
            d.dataDef.push(...detailsDef(d));
            d.dataDef.push(typeDef(d));
            d.dataDef.push(unitsDef(d));
            d.dataDef.push(mustDef(d));
            break;

        case 'leaf-list':
            d.dataDef.push(...detailsDef(d));
            d.dataDef.push(typeDef(d));
            d.dataDef.push(...listDetailsDefs(d));
            d.dataDef.push(unitsDef(d));
            d.dataDef.push(mustDef(d));
            break;

        case 'choice':
            const cases = new meta.List(d, 'cases');
            cases.key = ['ident'];
            d.dataDef.push(cases);
            cases.dataDef.push(...headerDefs(cases));
            cases.dataDef.push(ddef); // recursive definition
            cases.dataDef.push(...actionsAndNotifysDefs(cases));
            break;
        }
    }
    return ddef;
}

function whenDef(parent: meta.Meta): meta.Leaf {
    const l = new meta.Leaf(parent, 'when');
    l.type = ({format: val.Format.Str} as meta.Type);
    return l;
}

function actionsAndNotifysDefs(parent: meta.Meta): meta.Definition[] {
    const action = new meta.List(parent, 'action');
    action.key = ['ident'];
    action.dataDef.push(...headerDefs(action));
    const input = new meta.Container(action, 'input');
    action.dataDef.push(input);
    const output = new meta.Container(action, 'output');
    action.dataDef.push(output);

    const notify = new meta.List(parent, 'notify');
    notify.key = ['ident'];
    notify.dataDef.push(...headerDefs(action));
    return [action, notify];
}

function headerDefs(parent: meta.Meta): meta.Definition[] {
    const ident = new meta.Leaf(parent, 'ident');
    ident.type = ({format: val.Format.Str} as meta.Type);
    return [ ident ];
}
