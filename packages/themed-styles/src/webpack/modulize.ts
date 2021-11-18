import cssesc from 'cssesc';
import normalizePath from 'normalize-path';
import path from 'path';
// import extractImports from 'postcss-modules-extract-imports';
// import localByDefault from 'postcss-modules-local-by-default';
// import modulesScope from 'postcss-modules-scope';
// import modulesValues from 'postcss-modules-values';
import type * as webpack from 'webpack';
import type { LoaderOptions } from '../config';
import loaderUtils from './loader-utils';

export type ModuleMode = 'local' | 'global';

export type LocalsConvention = 'asIs' | 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly';

export interface ModuleOptions {
    mode: ModuleMode;
    localIdentName?: string;
    context?: string;
    hashPrefix?: string;
    regExp?: string | RegExp;
    localsConvention?: LocalsConvention;
    getLocalIdent?: (loaderContext: webpack.LoaderContext<LoaderOptions>, name: string, options?: ModuleOptions) => string;
}

interface NormalModuleOptions extends ModuleOptions {
    localIdentName: string;
    hashPrefix: string;
    localsConvention: LocalsConvention;
}

export type ModuleOptionsType = boolean | ModuleMode | ModuleOptions;

export function normOptions(options: ModuleOptionsType = true): NormalModuleOptions | false {
    if (options === true || options === 'local') {
        options = {
            mode: 'local',
        };
    } else if (options === 'global') {
        options = {
            mode: 'global',
        };
    }
    if (options) {
        options.localIdentName = options.localIdentName || '[hash:base64]';
        options.localsConvention = options.localsConvention || 'asIs';
        options.hashPrefix = options.hashPrefix || '';
        return options as NormalModuleOptions;
    }
    return false;
}

const whitespace = '[\\x20\\t\\r\\n\\f]';
const unescapeRegExp = new RegExp(
    `\\\\([\\da-f]{1,6}${whitespace}?|(${whitespace})|.)`,
    'ig'
);

function unescape(str: string) {
    return str.replace(unescapeRegExp, (_, escaped, escapedWhitespace) => {
        const high = Number.parseInt(`0x${escaped}`, 16) - 0x10000;

        // NaN means non-codepoint
        // Workaround erroneous numeric interpretation of +"0x"
        return high !== high || escapedWhitespace
            ? escaped
            : high < 0
                ? // BMP codepoint
                String.fromCharCode(high + 0x10000)
                : // Supplemental Plane codepoint (surrogate pair)
                // tslint:disable-next-line:no-bitwise
                String.fromCharCode((high >> 10) | 0xd800, (high & 0x3ff) | 0xdc00);
    });
}

const filenameReservedRegex = /[<>:"/\\|?*\x00-\x1F]/g;
const reControlChars = /[\u0000-\u001f\u0080-\u009f]/g;
const reRelativePath = /^\.+/;

export function getLocalIdent(loaderContext: webpack.LoaderContext<LoaderOptions>, name: string, options: NormalModuleOptions) {
    if (!options.context) {
        options.context = loaderContext.rootContext;
    }

    const request = normalizePath(
        path.relative(options.context || '', loaderContext.resourcePath),
    );
    const opts = {
        content: `${options.hashPrefix + request}+${unescape(name)}`,
        regExp: options.regExp,
    };

    // Using `[path]` placeholder outputs `/` we need escape their
    // Also directories can contains invalid characters for css we need escape their too
    return cssesc(
        loaderUtils
            .interpolateName(loaderContext, options.localIdentName, opts)
            // For `[hash]` placeholder
            .replace(/^((-?[0-9])|--)/, '_$1')
            .replace(filenameReservedRegex, '-')
            .replace(reControlChars, '-')
            .replace(reRelativePath, '-')
            .replace(/\./g, '-'),
        { isIdentifier: true }
    ).replace(/\\\[local\\]/gi, name);
}
