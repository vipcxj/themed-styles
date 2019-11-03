import fs from 'fs';
import path from 'path';

function read(base: string, file: string) {
    return fs.readFileSync(path.join(base, 'cases', file));
}

export type TargetFilter = (file: string) => boolean;
export type MatchedFile = (file: string) => string;

export type Callback = (name: string, content: string, toMatch: string) => void;

export function each(base: string, targetFilter: TargetFilter, toMatchFile: MatchedFile, callback: Callback) {
    fs.readdirSync(path.join(base, 'cases')).forEach(p => {
        const name = path.basename(p);
        if (targetFilter(path.basename(p))) {
            const target = read(base,p).toString().trim();
            const toMatchName = toMatchFile(name);
            const toMatch = read(base, toMatchName).toString().trim();
            callback(name, target, toMatch);
        }
    })
}

export function normJson(json: string) {
    return JSON.stringify(JSON.parse(json), null, 2);
}