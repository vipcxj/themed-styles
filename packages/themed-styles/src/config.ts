import { JSONSchema7 as Schema } from 'json-schema';
import path from 'path';
import postcss from "postcss";
import validateOptions from 'schema-utils';
import { ModuleOptionsType } from "./webpack/modulize";

export interface ThemeProperty {
    defaultValue: string;
}

export interface ThemeConfig {
    [key: string]: string | ThemeProperty;
}

export type TaggedTheme = ThemeConfig & {
    __path__?: string;
}

export interface RuntimeTheme {
    [key: string]: string;
}

export function cleanSchema(schema: Schema) {
    const { definitions, ...rest } = schema;
    return rest;
}

export const schemaProperty: Schema = {
    type: "object",
    properties: {
        defaultValue: {
            type: "string",
        }
    },
    required: ['defaultValue'],
};

export const schemaTheme: Schema = {
    type: "object",
    patternProperties: {
        "^[a-zA-Z_][0-9a-zA-Z_]*$": {
            anyOf: [
                { type: "string" },
                { $ref: '#/definitions/property' }
            ],
        },
    },
    additionalProperties: false,
    definitions: {
        property: cleanSchema(schemaProperty),
    },
};

function myRequire(file: string) {
    require.resolve(file);
    return require(file);
}

export function loadTheme(context: string, pluginName: string, file?: string | object) {
    let obj;
    let resolved: boolean = false;
    const provided: boolean = !!file;
    if (typeof file === 'string') {
        try {
            obj = myRequire(path.resolve(context, file));
            resolved = true;
            // tslint:disable-next-line:no-empty
        } catch (e) {}
    } else if (!file) {
        file = path.resolve(context, 'theme.js');
        try {
            obj = myRequire(file);
            resolved = true;
            // tslint:disable-next-line:no-empty
        } catch (e) {}
        if (!resolved) {
            file = path.join(context, 'theme.ts');
            try {
                obj = myRequire(file);
                resolved = true;
                // tslint:disable-next-line:no-empty
            } catch (e) {}
        }
        if (!resolved) {
            file = path.join(context, 'theme.json');
            try {
                obj = myRequire(file);
                resolved = true;
                // tslint:disable-next-line:no-empty
            } catch (e) {}
        }
    } else {
        obj = file;
        resolved = true;
    }
    if (!resolved) {
        throw new Error(`Unable to resolve the theme file ${ provided ? file : 'under context' + context }.`);
    }
    if (!obj) {
        throw new Error(`Invalid theme file ${file}.`);
    }
    validateOptions(schemaTheme, obj, { name: pluginName });
    const theme = obj as TaggedTheme;
    theme.__path__  = typeof file === 'string' ? file : undefined;
    return theme;
}

export function resolveDefaultTheme(theme: ThemeConfig): RuntimeTheme {
    const keys = Object.keys(theme);
    const out: RuntimeTheme = {};
    for (const key of keys) {
        const value = theme[key];
        out[key] = typeof value === 'string' ? value : value.defaultValue;
    }
    return out;
}

export interface LoaderOptions {
    theme: ThemeConfig;
    themePath?: string;
    plugins?: {
        pre: postcss.AcceptedPlugin[],
        post: postcss.AcceptedPlugin[],
    };
    modules?: ModuleOptionsType;
}

export interface PluginOptions {
    context?: string;
    theme?: string | ThemeConfig;
    modules?: ModuleOptionsType;
    plugins?: {
        pre: postcss.AcceptedPlugin[],
        post: postcss.AcceptedPlugin[],
    };
}