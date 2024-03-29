import { JSONSchema7 as Schema } from 'json-schema';
import postcss from 'postcss';
import validateOptions from 'schema-utils';
import type * as webpack from 'webpack';
import { cleanSchema, LoaderOptions as Options, schemaConfig, schemaProperty, schemaStruct, schemaTheme } from '../config';
import parser from '../postcss/parse';
import plugin, { getThemedRulesMessage, getThemedSheetMessage, Options as PluginOption } from '../postcss/plugin';
import { getLocalIdent, normOptions as normModuleOptions } from './modulize';

const LOADER_NAME = 'themed-styles-loader';

const schema: Schema = {
    type: "object",
    properties: {
        theme: {
            $ref: '#/definitions/config',
        },
    },
    definitions: {
        property: cleanSchema(schemaProperty),
        struct: cleanSchema(schemaStruct),
        theme: cleanSchema(schemaTheme),
        config: cleanSchema(schemaConfig),
    },
};

const loader: webpack.LoaderDefinition<Options> = function (css, source) {
    const callback = this.async();
    const options: Options = this.getOptions();
    validateOptions(schema, options, { name: LOADER_NAME });
    const { modules, theme, themePath, plugins = {} as Options['plugins'] } = options;
    if (themePath) {
        this.addDependency(themePath);
    }
    const moduleOptions = normModuleOptions(modules);
    const pluginOption: PluginOption = {
        theme,
        modules: moduleOptions ? moduleOptions.mode : false,
        localsConvention: (moduleOptions && moduleOptions.localsConvention) || 'asIs',
        classExporter: (name, module) => {
            return module && moduleOptions ? getLocalIdent(this, name, moduleOptions) : name;
        },
    };
    const { pre = [],  post = [] } = plugins;
    postcss([...pre, plugin(pluginOption), ...post]).process(css, { from: this.resource, to: undefined, parser }).then((result) => {
        const { messages } = result;
        const sheepMsg = getThemedSheetMessage(messages);
        const rulesMsg = getThemedRulesMessage(messages);
        const sheet = `export const sheet = ${JSON.stringify(sheepMsg.data)};`;
        const rules = `export const rules = ${JSON.stringify(rulesMsg.data, (key, value) => {
            if (typeof value === 'object' && value instanceof Set) {
                return Array.from(value);
            } else {
                return value;
            }
        })};`;
        callback(null, `
            import { Styles } from 'themed-styles-runtime';
            ${sheet}
            ${rules}
            export default Styles.registerStyles(module.id, rules, sheet);
        `, source);
    });
};

export default loader;
