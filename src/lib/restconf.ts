import * as node from './node.js';
import * as nodes from './nodes.js';
import * as meta from './meta.js';
import * as src from './src.js';
import * as yang from './yang.js';
import * as device from './device.js';
import * as schema from './schema.js';

console.log('restconf.ts');

export async function client(ypath: src.Source, url: string): Promise<device.Device> {
    const m = await yang.load(ypath, 'ietf-yang-library');
    const addr = new Address(url);
    const client = new Client(addr);
    const loaderNode = new ClientNode(client, addr.deviceId);
    const loader = new node.Browser(m, loaderNode.node());
    client.modules = device.loadModules(loader, resolver(ypath, url));
    return client;
}

function resolver(_: src.Source, baseUrl: string): device.Resolver {
    return async (hnd: device.ModuleHnd): Promise<meta.Module> => {
        const data = await fetch(baseUrl + '/schema/' + hnd.name, {
                method: 'GET',
                headers: {
                    'Accept-type' : 'application/json'
                }
            });
        return schema.load(data.json());
    };
}

class Address {
    readonly base: string;
    readonly data: string;
    readonly stream: string;
    readonly schema: string;
    readonly deviceId: string;
    readonly host: string;
    readonly origin: string;

    constructor(url: string) {
        // remove trailing '/' if there is one to prepare for appending
        if (url.endsWith('/')) {
            url = url.substr(0, url.length - 2);
        }
        const parsed = new URL(url);
        this.base = parsed.origin + parsed.pathname;
        this.data = this.base + '/data';
        this.stream = 'ws://' + this.host + '/restconf/streams';
        this.schema = this.base + '/schema';
        this.origin = parsed.origin;
        this.host = parsed.host;
        this.deviceId = findDeviceIdInUrl(url);
    }
}

export function findDeviceIdInUrl(url: string): string {
    const match = '/restconf=';
    const pos = url.indexOf(match);
    if (pos > 0) {
        const s = url.substr(pos + match.length);
        return s.substring(0, url.indexOf('/') - 2);
    }
    return '';
}

class Client implements device.Device, RestClient {
    modules: Map<string, meta.Module>;

    constructor(public readonly addr: Address) {
    }

    browser(module: string): node.Browser {
        const n = new ClientNode(this, this.addr.deviceId).node();
        const m = this.modules.get(module);
        if (m === undefined) {
            throw new Error('no module defined ' + module);
        }
        return new node.Browser(m, n);
    }

    async request(method: string, p: node.Path, params: string, payload: Buffer | null): Promise<node.Node | null> {
        const mod = meta.root(p.meta);
        const paramsStr = (params ? '?' + params : '');
        const data = await fetch(`${this.addr.data}${mod.ident}:${p.toStringNoModule()}?${paramsStr}`, {
            method : method,
            headers : {
                'Content-Type' : 'application/json',
                'Accept' : 'application/json'
            },
            body: payload
        });
        return nodes.reflect(await data.json());
    }
}

interface RestClient {
    request(method: string, p: node.Path, params: string, payload: Buffer | null): Promise<node.Node | null>;
}

class ClientNode  {
    private method: string;
    private edit?: node.Node;
    private changes?: node.Node;
    private valid?: boolean;

    constructor(
        public readonly rest: RestClient,
        public readonly deviceId: string,
        public readonly params?: string
    ) {
    }

    node(): node.Node {
        return nodes.basic({
            onBeginEdit: async (r: node.NodeRequest) => {
                if (!r.editRoot) {
                    return;
                }
                if (r.create) {
                    this.method = 'POST';
                } else {
                    this.method = 'PUT';
                }
                const edit = await this.startEditMode(r.selection.path);
                if (edit) {
                    this.edit = edit;
                }
            },
            onEndEdit: async (r: node.NodeRequest)  => {
                if (!r.editRoot) {
                    return;
                }
                if (this.changes === undefined) {
                    throw new Error('no changes captured');
                }
                await this.request(this.method, r.selection.path, r.selection.split(this.changes));
            },
            onChild: async (r: node.ChildRequest) => {
                if (r.target !== undefined) {
                    const valid = await this.validNavigation(r.target);
                    if (valid) {
                        return null;
                    }
                }
                if (this.edit !== undefined) {
                    return this.edit.child(r);
                }
                return this.startReadMode(r.selection.path);
            },
        });
    }

    startReadMode(p: node.Path): Promise<node.Node | null> {
        return this.get(p, this.params);
    }

    get(p: node.Path, params?: string): Promise<node.Node | null> {
        return this.rest.request('GET', p, params!, null);
    }

    request(method: string, p: node.Path, input?: node.Selection): Promise<node.Node | null> {
        let payload: Buffer | null;
        if (input) {
            payload = new Buffer(nodes.toJson(input), 'utf-8');
        } else {
            payload = null;
        }
        return this.rest.request(method, p, '', payload);
    }

    async startEditMode(p: node.Path): Promise<node.Node | null> {
        const existing = await this.get(p, 'depth=1&content=config&with-defaults=trim');
        this.changes = nodes.reflect({obj: {}});
        const edit = nodes.extend({
            base: this.changes,
            onChild: (base: node.Node, r: node.ChildRequest): node.ChildResponse => {
                if (!r.create && existing !== null) {
                    return existing.child(r);
                }
                return base.child(r);
            }
        });
        return edit;
    }

    async validNavigation(target: node.Path): Promise<boolean> {
        if (this.valid === undefined) {
            this.valid = true;
            const resp = await this.request('OPTIONS', target);
            if (resp != null) {
                return true;
            }
        }
        return false;
    }
}