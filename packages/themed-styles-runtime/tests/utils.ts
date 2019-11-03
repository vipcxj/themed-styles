import fs from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import { PluginOptions, WebpackPlugin } from 'themed-styles';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import VirtualModulePlugin from 'webpack-virtual-modules';

interface File {
    path: string;
    content?: string;
}

function start(webpackConfig: webpack.Configuration, serverConfig: WebpackDevServer.Configuration) {
    const compiler = webpack(webpackConfig);
    return new WebpackDevServer(compiler, serverConfig);
}

export function startTestServer(context:string, files: File[], pluginOptions: PluginOptions) {
    if (files.length <= 0) {
        throw new Error('The files can not be empty.');
    }
    const virtualFiles: { [path: string]: string; } = {};
    for (const file of files) {
        const { path: p, content } = file;
        const rPath = path.resolve(context, p);
        if (!content && fs.existsSync(rPath)) {
            file.content = fs.readFileSync(rPath).toString();
        }
        virtualFiles[p] = file.content;
    }
    virtualFiles['node_modules/themed-styles-runtime.js'] = `exports = require(${require.resolve('../src')});`;
    const TsconfigPathsWebpackPlugin = require('tsconfig-paths-webpack-plugin');
    const webpackConfig: webpack.Configuration = {
        context,
        entry: files[0].path,
        mode: 'development',
        output: {
            path: path.resolve(__dirname),
            filename: 'bundle.js',
        },
        module: {
            rules: [
                { test: /\.tcss$/, loader: WebpackPlugin.loader },
                {
                    test: /\.tsx?$/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                        }
                    }
                },
            ],
        },
        resolve: {
            extensions: ['.ts', '.js'],
            plugins: [new TsconfigPathsWebpackPlugin({ configFile: path.resolve(__dirname, '../tsconfig.json')})],
        },
        plugins: [
            new WebpackPlugin(pluginOptions) as unknown as webpack.Plugin,
            new VirtualModulePlugin(virtualFiles),
            new HtmlWebpackPlugin(),
        ],
        devServer: {
            hot: true,
        }
    };
    return start(webpackConfig, {});
}