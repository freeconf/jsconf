
import * as fs from 'fs';
import fetch from 'node-fetch';

console.log('src.ts');

export interface Source {
    load(name: string, ext: string): Promise<ArrayBuffer>;
}

export function web(url: string): Source {
    return {
        load: async (name: string, ext: string): Promise<ArrayBuffer> => {
            const data = await fetch(url + name + ext, {
                method: 'GET',
                headers: {
                    'Accept-type' : 'application/json'
                }
            });
            return data.arrayBuffer();
        }
    };
}

export function multi(...srcs: Source[]): Source {
    return {
        load: async (name: string, ext: string): Promise<ArrayBuffer> => {
            for (const src of srcs) {
                try {
                    return src.load(name, ext);
                } catch (notFound) {
                }
            }
            throw new Error(`resource ${name}${ext} not found in any source.`);
        }
    };
}

export function str2ArrayBuffer(input: string): ArrayBuffer {
    const buf = new ArrayBuffer(input.length * 2); // 2 bytes for each char
    const bufView = new Uint16Array(buf);
    for (let i = 0, strLen = input.length; i < strLen; i++) {
        bufView[i] = input.charCodeAt(i);
    }
    return buf;
}

export function dir(root: string): Source {
    return {
        load: async (name: string, ext: string): Promise<ArrayBuffer> => {
            let filePath: string;
            if (ext === 'yang') {
                filePath = `${root}/${name}on`;
            } else {
                filePath = `${root}/${name}${ext}`;
            }
            return new Promise<ArrayBuffer>((resolve, reject) => {
                fs.readFile(filePath, 'utf-8', (err, data: string | Buffer) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (typeof data === "string") {
                            resolve(str2ArrayBuffer(data));
                        } else {
                            resolve(data.buffer);
                        }
                    }                    
                });
            });
        }
    };
}

export function arrayBuffer2Str(b: ArrayBuffer) : string {
    // 5 hours of googling but got there. It's possible
    // this only supports ASCII. need to fix this.
    // https://stackoverflow.com/questions/26754486/how-to-convert-arraybuffer-to-string
    return String.fromCharCode.apply(null, Array.from(new Uint16Array(b)));
}
