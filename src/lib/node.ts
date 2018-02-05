import * as meta from './meta.js';
import * as val from './val.js';
import {Editor, strategy}  from './edit.js';
import { Definition, Nodeable } from './meta.js';

console.log('node.ts');

export class FieldRequest {
    readonly path: Path;
    readonly selection: Selection;
    readonly meta: meta.Leafable;
    readonly target?: Path;
    readonly from?: Selection;
    readonly base?: Path;
    readonly write: boolean = false;
    readonly del: boolean = false;

    static reader(s: Selection, meta: meta.Leafable, target?: Path): FieldRequest {
        return {
            selection: s,
            meta: meta,
            target: target,
            path : new Path(meta, s.path),
        } as FieldRequest;
    }

    static writer(s: Selection, meta: meta.Leafable, from: Selection, base: Path): FieldRequest {
        return {
            selection: s,
            meta: meta,
            path : new Path(meta, s.path),
            from: from,
            base: base,
            write: true
        } as FieldRequest;
    }
}

export class ChildRequest {

    constructor(
        readonly selection: Selection,
        readonly meta: meta.Nodeable,
        readonly path: Path,
        readonly from?: Selection,
        readonly base?: Path,
        readonly create: boolean = false,
        readonly del: boolean = false,
        readonly target?: Path
    ) {
    }

    isNavigation(): boolean {
        return this.target !== undefined;
    }

    static reader(s: Selection, meta: meta.Nodeable): ChildRequest {
        return new ChildRequest(
            s,
            meta,
            new Path(meta, s.path));
    }

    static writer(s: Selection, meta: meta.Nodeable, from: Selection, base: Path): ChildRequest {
        return new ChildRequest(
            s,
            meta,
            new Path(meta, s.path),
            from,
            base,
            true);
    }
}

export class ListRequest {
    constructor(
        readonly selection: Selection,
        readonly meta: meta.List,
        readonly path: Path,
        readonly from?: Selection,
        readonly base?: Path,
        readonly key?: val.Value[],
        readonly startRow: number = 0,

        readonly create: boolean = false,
        readonly del: boolean = false,
        readonly target?: Path,
        readonly row: number = 0,
        readonly first: boolean = true,
    ) {
    }

    static writer(s: Selection, meta: meta.List, from: Selection, base: Path, key?: val.Value[]): ListRequest {
        return new ListRequest(
            s,
            meta,
            new Path(meta, s.path),
            from,
            base,
            key,
            0,
            true
        );
    }

    static readerByRow(s: Selection, meta: meta.List, row: number): ListRequest {
        return new ListRequest(
            s,
            meta,
            new Path(meta, s.path),
            undefined,
            undefined,
            undefined,
            row
        );
    }

    static readerByKey(s: Selection, meta: meta.List, key: val.Value[]): ListRequest {
        return new ListRequest(
            s,
            meta,
            new Path(meta, s.path),
            undefined,
            undefined,
            key
        );
    }

    next(): ListRequest {
        return new ListRequest(
            this.selection,
            this.meta,
            this.path,
            this.from,
            this.base,
            this.key,
            this.startRow,
            false,
            false,
            this.target,
            this.row + 1,
            false
        );
    }
}

export class NodeRequest {
    readonly selection: Selection;
    readonly create: boolean;
    readonly source: Selection;
    readonly editRoot: boolean = false;
}

export class  ActionRequest {
    readonly selection: Selection;
    readonly meta: meta.Action;
    readonly input?: Selection;

    static create(parent: Selection, meta: meta.Action, input?: Node): ActionRequest {
        if (input !== undefined) {
            return {
                selection: parent,
                meta: meta,
                input: new Selection(
                    parent.browser,
                    input,
                    new Path(meta, parent.path),
                    parent.context,
                    parent
                )
             } as ActionRequest;
        }
        return {
            selection: parent,
            meta: meta
        } as ActionRequest;
    }
}

export interface NotifyStream {
    (msg: Selection): void;
}

export class NotifyRequest {
    readonly selection: Selection;
    readonly meta: meta.Notification;
    readonly stream: NotifyStream;
}

export interface NotifyCloser {
    (): Error;
}

export class ValueHandle {
    val: val.Value;
}

export function parse(s: string, mod: meta.Module): Path[] {
    const segs = s.split('/');
    let def: Definition = mod;
    let p = new Path(def);
    const slice = [p];
    for (let i = 0; i < segs.length; i++) {
        // a/b/c same as a/b/c/
        if (segs[i] === '') {
            break;
        }

        const eq = segs[i].indexOf('=');
        let ident: string;
        let keys: (val.Value[]|undefined);
        if (eq >= 0) {
            ident = segs[i].substr(0, eq);
            const keyStrs = segs[i].substr(eq + 1).split(',');
            keys = values((def as meta.List).keyMeta, ...keyStrs);
        } else {
            ident = segs[i];
        }
        def = (def as Nodeable).definition(ident);
        p = new Path(def, p, keys as val.Value[]);
        slice.push(p);
    }
    return slice;
}

export class Path {
    constructor(meta: meta.Definition);
    constructor(meta: meta.Definition, parent: Path);
    constructor(meta: meta.Definition, parent: Path, key: val.Value[]);
    constructor(
        public readonly meta: meta.Definition,
        public readonly parent?: Path,
        public readonly key?: val.Value[]) {
    }

    toStringNoModule(): string {
        return this._toString(false);
    }

    toString(): string {
        return this._toString(true);
    }

    _toString(showModule: boolean): string {
        let s = this.meta.ident;
        if (this.key !== undefined) {
            s += '=';
            for (let i = 0; i < this.key.length; i++) {
                if (i !== 0) {
                    s += ',';
                }
                s += this.key[i].toString();
            }
        }

        if (this.parent === undefined) {
            return s;
        }

        if (!showModule && this.parent instanceof meta.Module) {
            return s;
        }

        return this.parent.toString() + '/' + s;
    }
}

export class Browser {

    constructor(readonly meta: meta.Module, readonly node: Node) {
    }

    Root(): Selection {
        return new Selection(
            this,
            this.node,
            new Path(this.meta),
            new Map<string, any>()
        );
    }
}

export function values(metas: meta.Leafable[], ...x: any[]): val.Value[] {
    const vals = new Array<val.Value>(metas.length);
    for (let i = 0; i < vals.length; i++) {
        vals[i] = value(metas[i], x[i]);
    }
    return vals;
}

export function value(m: meta.Leafable, x: any): val.Value {
    switch (m.type.format) {
    case val.Format.Enum:
        return val.enm(toEnum(m.type.enum, x));
    case val.Format.EnumList:
        return val.enums(toEnumList(m.type.enum, x));
    case val.Format.Union:
        throw new Error('TODO');
    }
    return val.conv(m.type.format, x);
}

function toEnumList(l: val.EnumList, x: any): val.Enum[] {
    if (x instanceof Array) {
        const vals = new Array<val.Enum>(x.length);
        for (let i = 0; i < x.length; i++) {
            vals[i] = toEnum(l, x[i]);
        }
        return vals;
    }
    return [toEnum(l, x)];
}

function toEnum(l: val.EnumList, x: any): val.Enum {
    try {
        const v = val.conv(val.Format.Int32, x);
        return l.byId(v.val as number);
    } catch (nan) {
        const v = val.conv(val.Format.Str, x);
        return l.byLabel(v.val as string);
    }
}

export class Selection {

    constructor(
        readonly browser: Browser,
        readonly node: Node,
        readonly path: Path,
        readonly context: Map<string, any>,
        readonly parent?: Selection,
        readonly insideList = false
        ) {
    }

    async value(ident: string): Promise<val.Value> {
        // TODO: not sure why i have to cast to any, then leafable
        const d: any = (this.meta as meta.Nodeable).definition(ident);
        const r = FieldRequest.reader(this, (d as meta.Leafable));
        const v = await this.valueHnd(r)
        return v.val;
    }

    get meta(): Definition {
        return this.path.meta as meta.Definition;
    }

    get key(): (val.Value[] | undefined) {
        return this.path.key;
    }

    async valueHnd(r: FieldRequest, useDefault: boolean = true): Promise<ValueHandle> {
        // TODO: Check pre/post constraints
        const hnd = new ValueHandle();
        await this.node.field(r, hnd);
        if (hnd.val == null && useDefault && r.meta.hasDefault) {
            hnd.val = value(r.meta, r.meta.default);
        }
        return hnd;
    }

    async setValueHnd(r: FieldRequest, hnd: ValueHandle) {
        // TODO: Check pre/post constraints
        await this.node.field(r, hnd);
    }

    async select(r: ChildRequest): Promise<Selection | null> {
        // TODO: Check pre/post constraints
        const child = await this.node.child(r);
        if (child !== null) {
            return new Selection(
                this.browser,
                child,
                new Path(r.meta, this.path),
                this.context,
                this,
            );
        }
        return null;
    }

    async selectListItem(r: ListRequest): Promise<Selection | null> {
        // TODO: Check pre/post constraints
        const resp = await this.node.next(r);
        if (resp === null) {
            return null;
        }
        const [child, key] = resp;
        let path: Path;
        if (r.meta.keyMeta.length > 0) {
            if (key === undefined) {
                throw new Error('no key returned for ' + r.path.toString());
            }
            // NOTE: use this.path.parent not, this.path so list is not in twice
            path = new Path(r.meta, this.path.parent as Path, key);
        } else {
            path = new Path(r.meta, this.path.parent as Path);
        }
        return new Selection(
            this.browser,
            child,
            path,
            this.context,
            this,
            true,
        );
    }

    async insertInto(to: Node) {
        const e = new Editor(this.path);
        await e.edit(this, this.split(to), strategy.insert);
    }

    async insertFrom(from: Node) {
        const e = new Editor(this.path);
        await e.edit(this.split(from), this, strategy.insert);
    }

    async upsertInto(to: Node) {
        const e = new Editor(this.path);
        await e.edit(this, this.split(to), strategy.upsert);
    }

    async upsertFrom(from: Node) {
        const e = new Editor(this.path);
        await e.edit(this.split(from), this, strategy.upsert);
    }

    async updateInto(to: Node) {
        const e = new Editor(this.path);
        await e.edit(this, this.split(to), strategy.update);
    }

    async updateFrom(from: Node) {
        const e = new Editor(this.path);
        await e.edit(this.split(from), this, strategy.update);
    }

    split(n: Node): Selection {
        return new Selection(
            new Browser(meta.root(this.path.meta), n),
            n,
            this.path,
            this.context,
            undefined,
            this.insideList,
        );
    }

    async beginEdit(nr: NodeRequest, bubble: boolean) {
        const r = {
            selection: this as Selection, // not sure why cast is nec.
            create: nr.create,
            source: nr.source,
            editRoot: true
        };
        while (true) {
            await r.selection.node.beginEdit(r as NodeRequest);

            if (r.selection.parent == null || !bubble) {
                break;
            }

            r.selection = r.selection.parent;
            r.editRoot = false;
        }
    }

    async endEdit(nr: NodeRequest, bubble: boolean) {
        const r = {
            selection: this as Selection,
            create: nr.create,
            source: nr.source,
            editRoot: true
        };
        while (true) {
            await this.node.endEdit(r as NodeRequest);

            if (r.selection.parent == null || !bubble) {
                break;
            }

            r.selection = r.selection.parent;
            r.editRoot = false;
        }
    }

    find(_: string): (Selection | null) {

        // TODO
        //   parse url w/params
        //   navigate/select
        return null;
    }

    async action(input?: Node): Promise<Selection | null> {
        // TODO: check constraints
        const r = ActionRequest.create(this, this.meta as meta.Action, input);
        const output = await this.node.action(r);
        if (output != null) {
            return new Selection(
                this.browser,
                output,
                new Path(r.meta.output, this.path),
                this.context,
                this
            );
        }
        return null;
    }
}

export type ListItemTuple = [Node, val.Value[] | undefined];

export type ListResponse = ListItemTuple | Promise<ListItemTuple | null> | null;

export type ChildResponse = Node | Promise<Node | null> | null;

export type ActionResponse = Node | Promise<Node | null> | null;

export type NotifyResponse = NotifyCloser | null;

export type EmptyResponse = void | Promise<void>;

export interface Node {
    child(r: ChildRequest): ChildResponse;
    field(r: FieldRequest, hnd: ValueHandle): EmptyResponse;
    next(r: ListRequest): ListResponse;
    choose(sel: Selection, choice: meta.Choice): meta.ChoiceCase;
    remove(r: NodeRequest): EmptyResponse;
    beginEdit(r: NodeRequest): EmptyResponse;
    endEdit(r: NodeRequest): EmptyResponse;
    action(r: ActionRequest): ActionResponse;
    notify(r: NotifyRequest): NotifyResponse;
    peek(s: Selection, consumer: any): (any | null);
    context(s: Selection, ctx: Map<string, any>): Map<string, any>;
}

