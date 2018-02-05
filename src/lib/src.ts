

console.log('src.ts');

export interface Source {
    load(name: string, ext: string): Promise<Blob>;
}

export function webDir(url: string): Source {
    return {
        load: async (name: string, _: string): Promise<Blob> => {
            const data = await fetch(url + name + ".json", {
                method: 'GET',
                headers: {
                    'Accept-type' : 'application/json'
                }
            });
            return data.blob();
        }
    };
}

export function web(url: string): Source {
    return {
        load: async (name: string, _: string): Promise<Blob> => {
            const data = await fetch(url + name, {
                method: 'GET',
                headers: {
                    'Accept-type' : 'application/json'
                }
            });
            return data.blob();
        }
    };
}

export function multi(...srcs: Source[]): Source {
    return {
        load: async (name: string, ext: string): Promise<Blob> => {
            for (const src of srcs) {
                try {
                    return src.load(name, ext);
                } catch (notFound) {
                }
            }
            throw new Error(`resource ${name}.${ext} not found in any source.`);
        }
    };
}

export function x(src: any): Source {
    return {
        load: async (name: string, ext: string): Promise<Blob> => {
            const found = src[name];
            if (found !== undefined) {
                return Promise.resolve(new Blob([JSON.stringify(found)]));
            }
            throw new Error(`x source could not find ${name}.${ext}`);
        }
    };
}