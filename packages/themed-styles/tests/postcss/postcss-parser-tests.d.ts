declare module 'postcss-parser-tests' {
    export function jsonify(root: any): string;
    export function each(callback: (name: string, css: string, ideal: string) => void): void;
}