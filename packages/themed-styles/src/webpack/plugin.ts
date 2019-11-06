import fs from 'fs';
import path from "path";
import validateOptions from 'schema-utils';
import { Compiler, loader as Loader } from 'webpack';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import { LoaderOptions, PluginOptions as Options, schemaTheme, ThemeConfig } from '../config';

const PLUGIN_NAME = 'themed-styles-plugin';
const THEME_MODULE = 'themed-styles-theme-on-the-fly.json';
const THEME_VIRTUAL_PATH = path.resolve(`/node_modules/${THEME_MODULE}`);

function myRequire(p: string) {
    const m = require(p);
    if (!m) {
        return m;
    }
    const wrapped = (m && m.__esModule) ? m : { default: m };
    return wrapped.default;
}

function prepareTheme(compiler: Compiler, context: string, theme?: string | ThemeConfig): [ThemeConfig] | [ThemeConfig, string, () => void] {
    let themeObj: ThemeConfig;
    let themePath: string;
    let cleaner: () => void;
    if (typeof theme === 'undefined' || typeof theme === 'string') {
        if (!theme) {
            themePath = path.resolve(context, 'theme.config.json');
            try {
                themeObj = myRequire(themePath);
            } catch (e) {
                themePath = path.resolve(context, 'theme.config.js');
                try {
                    themeObj = myRequire(themePath);
                } catch (e) {
                    themePath = path.resolve(context, 'theme.config.ts');
                    try {
                        themeObj = myRequire(themePath);
                    } catch (e) {
                        themePath = undefined;
                    }
                }
            }
        } else {
            themePath = path.resolve(context, theme);
            try {
                themeObj = myRequire(themePath);
            } catch (e) {
                themePath = undefined;
            }
        }
    } else {
        themeObj = theme;
    }
    if (themeObj) {
        validateOptions(schemaTheme, themeObj, { name: PLUGIN_NAME });
        const virtualModules = new VirtualModulesPlugin({
            [THEME_VIRTUAL_PATH]: JSON.stringify(themeObj),
        });
        virtualModules.apply(compiler);
        if (themePath) {
            const listener = () => {
                virtualModules.writeModule(THEME_VIRTUAL_PATH, JSON.stringify(require(themePath)));
            };
            if (fs.watch) {
                const watcher = fs.watch(themePath, listener);
                cleaner = () => watcher.close();
            } else {
                fs.watchFile(themePath, listener);
                cleaner = () => fs.unwatchFile(themePath, listener);
            }
        }
        return [themeObj, themePath, cleaner];
    }
    throw new Error('Unable to resolve the theme config.');
}

class ThemedStylesPlugin {
    public static readonly loader: string = require.resolve('./loader');
    private static hackThemeLoader(module: any, opts: LoaderOptions) {
        if (module.loaders) {
            for (const loader of module.loaders) {
                if (loader.loader === ThemedStylesPlugin.loader) {
                    loader.options = opts;
                }
            }
        }
    }
    public readonly options: Options;
    constructor(options: Options = {}) {
        this.options = options;
    }
    public apply(compiler: Compiler): void {
        const { context, theme } = this.options;
        const [themeObj,, cleanWatcher] = prepareTheme(compiler, context || compiler.context, theme);
        if (cleanWatcher) {
            compiler.hooks.done.tap(PLUGIN_NAME, cleanWatcher);
            compiler.hooks.failed.tap(PLUGIN_NAME, cleanWatcher);
        }
        const { modules, plugins } = this.options;
        const loaderOpts: LoaderOptions = {
            theme: themeObj,
            themePath: path.resolve(compiler.context, THEME_VIRTUAL_PATH),
            plugins,
            modules,
        };
        // compiler.hooks.beforeRun.tap(PLUGIN_NAME, (c, ...others) => {
        //     c.options.module.rules.push({
        //         test: /\.tcss$/,
        //         use: {
        //            loader: path.join(__dirname, './loader.ts'),
        //         },
        //     });
        // });

        // compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (factory) => {
        //     factory.hooks.beforeResolve.tapAsync(PLUGIN_NAME, (data, callback) => {
        //         // tslint:disable-next-line:no-console
        //         console.log('before resolve');
        //         callback();
        //     })
        // });
        // compiler.hooks.beforeCompile.tapAsync(PLUGIN_NAME, (params: CompilationParams, callback) => {
        //     // tslint:disable-next-line:no-console
        //     console.log('before compile hooked!');
        //     const context = this.options.context || compiler.context;
        //     const configure = loadConfigure(context, PLUGIN_NAME, this.options.configure);
        //     configure.theme = loadTheme(context, PLUGIN_NAME, this.options.theme || configure.theme);
        //     this.configure = configure;
        //     params[PLUGIN_CONFIGURE_PARAM] = this.configure;
        //     callback();
        // });
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
            compilation.hooks.normalModuleLoader.tap(PLUGIN_NAME, (loaderContext: Loader.LoaderContext, module: any) => {
                ThemedStylesPlugin.hackThemeLoader(module, loaderOpts);
            });
        })
    }
}

export default ThemedStylesPlugin;