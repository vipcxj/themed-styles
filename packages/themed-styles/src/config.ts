import { JSONSchema7 as Schema } from 'json-schema';
import postcss from "postcss";
import { ModuleOptionsType } from "./webpack/modulize";

export interface ThemeProperty {
    defaultValue: string;
}

export interface ThemeConfig {
    struct: {
        [key: string]: string | ThemeProperty;
    },
    themes?: {
        [name: string]: RuntimeTheme;
    }
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

export const schemaStruct: Schema = {
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

export const schemaTheme: Schema = {
    type: 'object',
    patternProperties: {
        '^[a-zA-Z_][0-9a-zA-Z_]*$': {
            type: 'string',
        },
    },
    additionalProperties: false,
    definitions: {
        property: cleanSchema(schemaProperty),
    },
};

export const schemaConfig: Schema = {
    type: 'object',
    properties: {
        struct: {
            $ref: '#/definitions/struct',
        },
        themes: {
            $ref: '#/definitions/theme'
        }
    },
    additionalProperties: false,
    definitions: {
        struct: cleanSchema(schemaStruct),
        theme: cleanSchema(schemaTheme),
        property: cleanSchema(schemaProperty),
    },
};

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