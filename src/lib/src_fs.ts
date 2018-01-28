import * as fs from 'fs';
import * as child from 'child_process';
import * as src from './src.js';

console.log('src_fs.ts');

export function exe(exe: string, ypath: string): src.Source {
    return {
        load : (name: string, _: string): Buffer => {
            const cmd = `${exe} -ypath ${ypath} -module ${name}`;
            return child.execFileSync(cmd);
        }
    };
}

export function dir(root: string): src.Source {
    return {
        load: (name: string, ext: string): Buffer => {
            let filePath: string;
            if (ext === 'yang') {
                filePath = `${root}/${name}.json`;
            } else {
                filePath = `${root}/${name}.${ext}`;
            }
            return fs.readFileSync(filePath);
        }
    };
}

