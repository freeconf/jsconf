

console.log('src.ts');

export interface Source {
    load(name: string, ext: string): Buffer;
}

export function multi(...srcs: Source[]): Source {
    return {
        load: (name: string, ext: string): Buffer => {
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
        load: (name: string, ext: string): Buffer => {
            const found = src[name];
            if (found !== undefined) {
                return new Buffer(JSON.stringify(found));
            }
            throw new Error(`x source could not find ${name}.${ext}`);
        }
    };
}