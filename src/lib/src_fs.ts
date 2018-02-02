import * as fs from 'fs';
import * as src from './src.js';

console.log('src_fs.ts');


function toBlob(input: string|Buffer): Blob {
    if (typeof input === "string") {
        return new Blob([input]);
    }
    return new Blob([input.buffer]);
}

export function dir(root: string): src.Source {
    return {
        load: async (name: string, ext: string): Promise<Blob> => {
            let filePath: string;
            if (ext === 'yang') {
                filePath = `${root}/${name}.json`;
            } else {
                filePath = `${root}/${name}.${ext}`;
            }
            return new Promise<Blob>((resolve, reject) => {
                fs.readFile(filePath, 'utf-8', (err, data: string | Buffer) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(toBlob(data));
                    }                    
                });
            });
        }
    };
}

