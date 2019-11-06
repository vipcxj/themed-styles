import { JSONSchema7 as Schema } from 'json-schema';
import { getOptions } from 'loader-utils';
import postcss from 'postcss';
import validateOptions from 'schema-utils';
import { loader } from 'webpack';
import { cleanSchema, LoaderOptions as Options, schemaProperty, schemaStruct, schemaTheme } from '../config';
import parser from '../postcss/parse';
import plugin, { getThemedRulesMessage, getThemedSheetMessage, Options as PluginOption } from '../postcss/plugin';
import { getLocalIdent, normOptions as normModuleOptions } from './modulize';

const LOADER_NAME = 'themed-styles-loader';

const schema: Schema = {
    type: "object",
    properties: {
        theme: {
            $ref: '#/definitions/theme',
        },
    },
    definitions: {
        property: cleanSchema(schemaProperty),
        struct: cleanSchema(schemaStruct),
        theme: cleanSchema(schemaTheme),
    },
};

const loader: loader.Loader = function (css, source) {
    const callback = this.async();
    const options: Options = getOptions(this) as Options;
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
