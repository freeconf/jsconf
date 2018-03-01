import * as node from './node.js';
import * as reflect from './nodes/reflect.js';
import * as extend from './nodes/extend.js';
import * as basic from './nodes/basic.js';
import * as meta from './meta.js';

console.log('device.ts');

export interface Device {
    modules: Map<string, meta.Module>;

    browser(module: string): node.Browser;
}

export class ModuleHnd {
    schema?: string;
    revision?: string;
    namespace?: string;
    constructor(public readonly name: string) {}
}

export type Resolver = (hnd: ModuleHnd) => Promise<meta.Module>;

export async function loadModules(ietfYangLib: node.Browser, resolver: Resolver): Promise<Map<string, meta.Module>> {
    const mods = new Map<string, meta.Module>();
    const s = await ietfYangLib.Root().find("modules-state/module");
    if (s === null) {
        throw new Error("no modules found");
    }
    const n = loadModulesListNode(mods, resolver);
    await s.insertInto(n);
    return mods;
}

function loadModulesListNode(mods:  Map<string, meta.Module>, resolver: Resolver): node.Node {
    return basic.node({
        onNext: (r: node.ListRequest) => {
            const key = r.key;
            if (r.create && key !== undefined) {
                const hnd = new ModuleHnd(key[0].toString());
                return [loadModuleNode(mods, resolver, hnd), key];
            }
            return null;
        }
    });
}

function loadModuleNode(mods: Map<string, meta.Module>, resolver: Resolver, hnd: ModuleHnd): node.Node {
    return extend.node({
        base: reflect.node({obj: hnd}),
        onEndEdit: async (base: node.Node, r: node.NodeRequest) => {
            await base.endEdit(r);
            const mod = await resolver(hnd);
            mods.set(mod.ident, mod);
        }
    });
}