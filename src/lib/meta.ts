
import * as val from './val.js';

console.log("meta.ts");

export interface Meta {
    parent: Meta;
}

export interface Definition extends Meta {
    ident: string;
    description: string;
    reference: string;
}

export interface Nodeable extends Definition {
    dataDef: Definition[];
    choice(ident: string): Choice;
    definition(ident: string): Definition;
}

export interface Leafable extends Definition {
    type: Type;
    hasDefault: boolean
    default: string
}

export function isLeaf(d:Definition): boolean {
    return (d instanceof Leaf || d instanceof LeafList);
}

export interface HasActions extends Nodeable {
    actions: Map<string, Action>;
}

export interface HasNotifications extends Nodeable {
    notifys: Map<string, Notification>;
}

export class Module implements Definition, Nodeable, HasActions, HasNotifications {
    parent: Meta;
    revision: any;
    readonly dataDef: Definition[];
    readonly actions: Map<string, Action>;
    readonly notifys: Map<string, Notification>;
    description: string;
    reference: string;
    namespace: string;
    private defs: Defs;

    constructor(public ident: string) {
        this.dataDef = new Array<Definition>();
        this.actions = new Map<string, Action>();
        this.notifys = new Map<string, Notification>();
        this.defs = new Defs(this.dataDef, this.actions, this.notifys);
    }

    definition(ident: string) : Definition {
        return this.defs.definition(ident);
    }

    choice(ident: string): Choice {
        return this.defs.choice(ident);
    }    
}

export class Leaf implements Leafable {
    description: string;
    type: Type;
    reference: string;
    default: string;

    constructor(public parent: Meta, public ident: string) {
    }

    get hasDefault(): boolean {
        return true;
    }
}

export class Any implements Leafable {
    description: string;
    type: Type;
    reference: string;

    constructor(public parent: Meta, public ident: string) {
    }    

    get default(): any {
        throw new Error("any cannot have default value");
    }

    get hasDefault(): boolean {
        return false;
    }
}

export class LeafList implements Leafable {
    description: string;
    type: Type;
    reference: string;
    default: string;

    constructor(public parent: Meta, public ident: string) {
    }

    get hasDefault(): boolean {
        return true;
    }
}

export class Type {
    ident: string;
    path: string;
    format: val.Format;
    enum: val.EnumList;
}

export class Container implements Definition, Nodeable, HasActions, HasNotifications {
    description: string;
    reference: string;
    readonly dataDef: Definition[];
    readonly actions: Map<string, Action>;
    readonly notifys: Map<string, Notification>;
    private defs: Defs;

    constructor(public parent: Meta, public ident: string) {
        this.dataDef = new Array<Definition>();
        this.actions = new Map<string, Action>();
        this.notifys = new Map<string, Notification>();
        this.defs = new Defs(this.dataDef, this.actions, this.notifys);
    }

    definition(ident: string) : Definition {
        return this.defs.definition(ident);
    }

    choice(ident: string): Choice {
        return this.defs.choice(ident);
    }    
}

export class List implements Definition, Nodeable, HasActions, HasNotifications {
    description: string;
    reference: string;
    key: string[];
    unbounded: boolean;
    maxElements: number;
    readonly dataDef: Definition[];
    readonly actions: Map<string, Action>;
    readonly notifys: Map<string, Notification>;
    private defs: Defs;
    private _keyMeta: Leafable[];

    constructor(public parent: Meta, public ident: string) {
        this.dataDef = new Array<Definition>();
        this.actions = new Map<string, Action>();
        this.notifys = new Map<string, Notification>();
        this.defs = new Defs(this.dataDef, this.actions, this.notifys);
    }

    definition(ident: string) : Definition {
        return this.defs.definition(ident);
    }

    choice(ident: string): Choice {
        return this.defs.choice(ident);
    }    

    get keyMeta(): Leafable[] {
        if (this._keyMeta == null) {
            this._keyMeta = new Array<Leafable>(this.key.length);
            for (let i = 0; i < this.key.length; i++) {
                this._keyMeta[i] = this.definition(this.key[i]) as Leafable;
            }
        }
        return this._keyMeta;
    }
}

export class Action implements Definition {
    description: string;
    reference: string;
    input: RpcInput;
    output: RpcOutput;

    constructor(public parent: Meta, public ident: string) {
    }
}

export class RpcInput implements Nodeable {
    description: string;
    reference: string;
    readonly dataDef: Definition[];
    private defs: Defs;

    constructor(public rpc: Action) {
        this.dataDef = new Array<Definition>();
        this.defs = new Defs(this.dataDef);
    }

    get ident(): string {
        return 'input';
    }

    get parent(): Meta {
        return this.rpc;
    }

    definition(ident: string) : Definition {
        return this.defs.definition(ident);
    }

    choice(ident: string): Choice {
        return this.defs.choice(ident);
    }    
}

export class RpcOutput implements Meta {
    description: string;
    reference: string;
    readonly dataDef: Definition[];
    private defs: Defs;

    constructor(public rpc: Action) {
        this.dataDef = new Array<Definition>();
        this.defs = new Defs(this.dataDef);
    }

    get ident(): string {
        return 'output';
    }

    get parent(): Meta {
        return this.rpc;
    }

    definition(ident: string) : Definition {
        return this.defs.definition(ident);
    }

    choice(ident: string): Choice {
        return this.defs.choice(ident);
    }    
}

export class Notification implements Definition {
    readonly dataDef: Definition[];
    description: string;
    reference: string;
    private defs: Defs;

    constructor(public parent: Meta, public ident: string) {
        this.dataDef = new Array<Definition>();
        this.defs = new Defs(this.dataDef);
    }

    definition(ident: string) : Definition {
        return this.defs.definition(ident);
    }

    choice(ident: string): Choice {
        return this.defs.choice(ident);
    }    
}

export class Choice implements Definition {
    readonly cases: Map<string, ChoiceCase>;
    description: string;
    reference: string;

    constructor(public parent: Meta, public ident: string) {
        this.cases = new Map<string, ChoiceCase>();
    }
}

export class ChoiceCase implements Nodeable, HasNotifications, HasActions {
    readonly dataDef: Definition[];
    readonly actions: Map<string, Action>;
    readonly notifys: Map<string, Notification>;
    description: string;
    reference: string;
    private defs: Defs;

    constructor(public parent: Meta, public ident: string) {
        this.dataDef = new Array<Definition>();
        this.actions = new Map<string, Action>();
        this.notifys = new Map<string, Notification>();
        this.defs = new Defs(this.dataDef, this.actions, this.notifys);
    }

    definition(ident: string) : Definition {
        return this.defs.definition(ident);
    }

    choice(ident: string): Choice {
        return this.defs.choice(ident);
    }
}

export function root(m: Meta): Module {
    let p = m;
    while (p.parent != null) {
        p = p.parent;
    }
    return p as Module;
}


class Defs {
    private index: Map<string, Definition>;

    constructor(
        public dataDef: Definition[],
        public actions?: Map<string, Action>,
        public notifys?: Map<string, Notification>
    ) {
    }

    choice(ident: string): Choice {
        let candidate = this.dataDef.find((d) => d.ident == ident);
        if (candidate == null) {
            throw new Error(ident + " choice not found");
        }
        return candidate as Choice;
    }

    definition(ident: string): Definition {
        if (this.actions != null) {
            const a = this.actions.get(ident);
            if (a != null) {
                return a;
            }    
        }
        if (this.notifys != null) {
            const n = this.notifys.get(ident);
            if (n != null) {
                return n;
            }    
        }
        if (this.index == undefined) {
            this.index = new Map<string, Definition>();
            for (const d of this.dataDef) {
                this.addIndex(d);
            }
        }
        const d = this.index.get(ident);
        if (d != null) {
            return d;
        }
        throw new Error(ident + ' not found');
    }

    private addIndex(d: Definition): void {
        if (d instanceof Choice) {
            let ch = d as Choice;
            for (let [_, kase] of ch.cases) {
                for (const def of kase.dataDef) {
                    this.addIndex(def);
                }
            }
        } else {
            this.index.set(d.ident, d);
        }
    }
}
