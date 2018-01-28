import * as node from './node.js';
import * as meta from './meta.js';

console.log('device.ts');

export interface Device {
    modules: Map<string, meta.Module>;

    browser(module: string): node.Browser;
}

export class ModuleHnd {
    name: string;
    schema: string;
    revision: string;
    namespace: string;
}

export type Resolver = (hnd: ModuleHnd) => Promise<meta.Module>;

export function loadModules(_: node.Browser, __: Resolver): Map<string, meta.Module> {
    return new Map<string, meta.Module>();
}