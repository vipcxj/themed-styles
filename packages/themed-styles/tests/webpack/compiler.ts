import MemoryFileSystem from 'memory-fs';
import path from 'path';
import webpack from 'webpack';
import VirtualModulePlugin from 'webpack-virtual-modules';
import { LoaderOptions, PluginOptions } from '../../src/config';
import Plugin from '../../src/webpack/plugin';

export interface Options {
    loader: boolean | LoaderOptions;
    plugin: boolean | PluginOptions;
    files?: VirtualFile[];
}

export const defaultOptions: Options = {
    loader: true,
    plugin: true,
    files: [],
};

function getDefaultOptions<T = LoaderOptions | PluginOptions>(loader: boolean | T) {
    if (typeof loader === 'boolean') {
        if (loader) {
            return {} as T;
        } else {
            return undefined;
        }
    } else {
        return loader;
    }
}

export function requireFromString(src: string, filename: string) {
    const Module = require('module');
    const m = new Module();
    m._compile(src, filename);
    return m.exports;
}

interface VirtualFile {
    path: string;
    content: string;
}

export default (entry: string | VirtualFile, options: Options = defaultOptions) => {
    const { loader, plugin } = options;
    const loaderOptions = getDefaultOptions(loader);
    const pluginOptions = getDefaultOptions(plugin);
    const virtualFiles: { [path: string]: string; } = {};
    let entryPath: string;
    if (typeof entry === 'object') {
        entryPath = entry.path;
        virtualFiles[entryPath] = entry.content;
    } else {
        entryPath = entry;
    }
    if (options.files) {
        for (const file of options.files) {
            virtualFiles[file.path] = file.content;
        }
    }
    const virtualPlugins:VirtualModulePlugin[] = [];
    if (Object.keys(virtualFiles).length > 0) {
        virtualPlugins.push(new VirtualModulePlugin(virtualFiles));
    }
    const compiler = webpack({
        context: __dirname,
        entry: entryPath,
        output: {
            path: path.resolve(__dirname),
            filename: 'bundle.js',
            library: 'test',
            libraryTarget: 'umd',
        },
        target: 'node',
        module: {
            rules: loaderOptions ? [{
                test: /\.tcss/,
                use: {
                    loader: Plugin.loader,
                    options: loaderOptions,
                },
            }] : [],
        },
        plugins: pluginOptions ? [
            new Plugin(pluginOptions),
            ...virtualPlugins,
        ] : virtualPlugins,
    });
    const fileSystem = new MemoryFileSystem();
    compiler.outputFileSystem = fileSystem;
    return new Promise<{ stats: webpack.Stats, output: any }>((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                reject(err);
                return;
            }
            if (stats.hasErrors()) {
                reject(new Error(stats.toJson().errors.join('\n')));
                return;
            }
            const outputPath = path.resolve(__dirname, 'bundle.js');
            const outputFile = fileSystem.readFileSync(outputPath).toString();
            const output = requireFromString(outputFile, outputPath).default;
            resolve({
                stats,
                output,
            });
        });
    });
};
