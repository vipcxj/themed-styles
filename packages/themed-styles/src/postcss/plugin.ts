import camelCase from 'camelcase';
import postcss from 'postcss';
import selectParser, { ClassName, Container, Root, Selector } from 'postcss-selector-parser';
import { ThemeConfig } from '../config';
import { compileTemplate, evalTemplate, ITemplatePart } from '../utils';

export type LocalsConvention = 'asIs' | 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly';

export interface Options {
    classExporter?: (name: string, module: boolean) => string;
    theme?: ThemeConfig;
    modules?: 'local' | 'global' | boolean;
    localsConvention?: LocalsConvention;
    exportLocalOnly?: boolean;
    themeDefault?: boolean;
}

const PLUGIN_NAME = 'postcss-theme-plugin';
const MESSAGE_TYPE_THEMED_RULES = 'themedRules';
const MESSAGE_TYPE_THEMED_SHEET = 'themedSheet';

interface ThisResultMessage extends postcss.ResultMessage {
    plugin: typeof PLUGIN_NAME;
}

export interface ThemedRule {
    classes: string[];
    parts: ITemplatePart[];
    vars: string[];
}

interface ThemedRulesMessage extends ThisResultMessage {
    type: typeof MESSAGE_TYPE_THEMED_RULES;
    data: ThemedRule[];
}

export interface ThemedSheet {
    parts: ITemplatePart[];
    moduleClass: string;
    suffix: string;
    classInfoes: ClassInfos;
    localsConvention: LocalsConvention;
}

interface ThemedSheetMessage extends ThisResultMessage {
    type: typeof MESSAGE_TYPE_THEMED_SHEET;
    data: ThemedSheet;
}

const dashesCamelCaseRegExp = /-+(\w)/g;
function dashesCamelCase(str: string) {
    return str.replace(dashesCamelCaseRegExp, (match, firstLetter) =>
        firstLetter.toUpperCase()
    );
}

function getOrCreateMessage<T extends postcss.ResultMessage>(messages: postcss.ResultMessage[], pred: (v: postcss.ResultMessage) => boolean, creator: () => T): T {
    for (const message of messages) {
        if (pred(message)) {
            return message as T;
        }
    }
    const newMessage: T = creator();
    messages.push(newMessage);
    return newMessage;
}

function addThemedRule(message: ThemedRulesMessage, classNames: string[], rule: postcss.Rule) {
    if (classNames.length > 0) {
        const [parts, deps] = compileTemplate(rule.toString());
        const { data } = message;
        data.push({
            classes: classNames,
            parts,
            vars: deps.filter(dep => dep.startsWith(':theme:')).map(dep => dep.substring(7)),
        });
        return data.length - 1;
    }
    return -1;
}

export function getThemedRulesMessage(messages: postcss.ResultMessage[]): ThemedRulesMessage {
    return getOrCreateMessage(messages,
        message => message.type === MESSAGE_TYPE_THEMED_RULES && message.plugin === PLUGIN_NAME,
        () => ({
            type: MESSAGE_TYPE_THEMED_RULES,
            plugin: PLUGIN_NAME,
            data: [],
        }),
    );
}

export function getThemedSheetMessage(messages: postcss.ResultMessage[]): ThemedSheetMessage {
    return getOrCreateMessage(messages,
        message => message.type === MESSAGE_TYPE_THEMED_SHEET && message.plugin === PLUGIN_NAME,
        () => ({
            type: MESSAGE_TYPE_THEMED_SHEET,
            plugin: PLUGIN_NAME,
            data: {
                parts: [],
                vars: [],
                moduleClass: '',
                suffix: '',
                classInfoes: {},
                exportLocalOnly: true,
                localsConvention: 'asIs',
            },
        }),
    );
}

function walkClass(node: Container, local: boolean, module: boolean, callback: (cls: ClassName, local: boolean) => void) {
    if (!module) {
        node.walkPseudos(n => {
            if (n.value === ':local' || n.value === ':global') {
                if (node.type === 'root') {
                    throw (node as Root).error('The local and global pseudo are not allowed with modules \'false\'.', {});
                }
            }
        })
    }
    let _local = local && module;
    node.each(n => {
        if (n.type === 'class') {
            callback(n, _local);
        } else {
            if (n.type === 'pseudo' && (n.value === ':local' || n.value === ':global')) {
                if (n.nodes.length > 0) {
                    walkClass(n, n.value === ':local', module, callback);
                    n.replaceWith(...n.nodes);
                } else {
                    _local = n.value === ':local';
                    n.remove();
                }
            } else if ('nodes' in n) {
                walkClass(n as Container, _local, module, callback);
            }
        }
    });
}

function checkVariable(variables: string[], theme: ThemeConfig) {
    for (const variable of variables) {
        if (!(variable in theme.struct)) {
            return variable;
        }
    }
    return undefined;
}

function createClassVariables(infoList: ClassInfos, opts: Options): void {
    const { localsConvention = 'asIs' } = opts;
    for (const name of Object.keys(infoList)) {
        const info = infoList[name];
        switch (localsConvention) {
            case 'camelCase':
            case 'camelCaseOnly':
                info.varName = camelCase(name);
                break;
            case 'dashes':
            case 'dashesOnly':
                info.varName = dashesCamelCase(name);
                break;
            case 'asIs':
                info.varName = name;
                break;
            default:
                throw new Error(`Invalid localsConvention ${localsConvention}`);
        }
    }
}

export function decideModuleClass(notModuleClasses: string[], name:string = 'defaultModuleClass'): string {
    if (notModuleClasses.indexOf(name) > 0) {
        return decideModuleClass(notModuleClasses, `_${name}`);
    } else {
        return name;
    }
}

export function decideSuffix(notModuleClasses: string[], suffix:string = '_'): string {
    for (const cls of notModuleClasses) {
        if (cls.endsWith(suffix)) {
            return decideSuffix(notModuleClasses, `_${suffix}`);
        }
    }
    return suffix;
}

const createClassDataCollector = (opts: Options, moduleClass: string, themed: boolean, themeDefault: boolean, data: string[]) => {
    return (root: Root) => {
        let hasLocal = false;
        walkClass(root, opts.modules !== 'global', opts.modules !== false, (cls, local) => {
            if (local) {
                hasLocal = true;
                const name = cls.value;
                data.push(name);
                cls.setPropertyWithoutEscape('value', `\${:class:${name}}`);
            }
        });
        const createDefaultModuleClass = () => {
            const n = selectParser.className({ value: 'place_holder' });
            n.setPropertyWithoutEscape('value', `\${:class:${moduleClass}}`);
            return n;
        };
        if (!hasLocal && themed) {
            if (themeDefault) {
                const temp = root.nodes.map(selector => [
                    selectParser.selector({
                        nodes: [createDefaultModuleClass(), selectParser.combinator({ value: ' ' }), ...(selector as Selector).nodes],
                        value: '',
                    }),
                    selectParser.selector({
                        nodes: [...(selector as Selector).nodes, createDefaultModuleClass()],
                        value: '',
                    }),
                ]);
                root.nodes = [];
                for (const subNodes of temp) {
                    root.nodes.push(...subNodes);
                }
                data.push(moduleClass);
            } else {
                throw root.error('The themed value is not allowed in the global rule. Or make themeDefault option to add the default module class to the global rule with themed value automatically.');
            }
        }
    };
};

function isDynamicRule(classes: string[], moduleClass: string, classInfos: ClassInfos) {
    for (const cls of classes) {
        if (cls === moduleClass) {
            return true;
        }
        const info = classInfos[cls];
        if (info && info.themed) {
            return true;
        }
    }
    return false;
}

const COMMENT_PREFIX_FOR_THEMED_RULE = 'this is the placeholder for themed rule: ';

interface ClassInfos {
    [name: string]: {
        varName: string;
        themed: boolean;
    };
}

function updateClassInfoes(infoes: ClassInfos, name: string, themed: boolean, varName?: string) {
    let info = infoes[name];
    if (!info) {
        info = {
            varName: varName || name,
            themed,
        };
        infoes[name] = info;
    } else {
        info.varName = varName || info.varName;
        info.themed = themed || info.themed;
    }
    return info;
}

export default postcss.plugin<Options>(PLUGIN_NAME, (opts = {}) => {
    const { localsConvention = 'asIs', theme = { struct: {} }, themeDefault = true } = opts;
     return (root, result) => {
         const { messages } = result;
         const sheetMsg = getThemedSheetMessage(messages);
         const rulesMsg = getThemedRulesMessage(messages);
         const classInfoes: ClassInfos = {};
         let allClasses: string[] = [];
         root.walkRules(rule => {
             let themed: boolean = false;
             rule.walkDecls(decl => {
                 const [, deps] = compileTemplate(decl.value);
                 const illegalVariable = checkVariable(deps, theme);
                 if (illegalVariable) {
                     throw decl.error(`The theme variable ${illegalVariable} is not listed in the theme config.`);
                 }
                 if (deps.length > 0) {
                     themed = true;
                 }
             });
             const selectorParser = selectParser(r => {
                 walkClass(r, opts.modules !== 'global', opts.modules !== false, (c, l) => {
                     if (l) {
                         updateClassInfoes(classInfoes, c.value, themed);
                     }
                     allClasses.push(c.value);
                 });
             });
             selectorParser.processSync(rule);
         });
         allClasses = allClasses.filter((cls, i, a) => a.indexOf(cls) === i);
         createClassVariables(classInfoes, opts);
         const moduleClass = decideModuleClass(allClasses);
         const suffix = decideSuffix(allClasses);
         root.walkRules(rule => {
             const classData: string[] = [];
             let themed = false;
             rule.walkDecls(decl => {
                 const [subParts, deps] = compileTemplate(decl.value);
                 if (deps.length > 0) {
                     themed = true;
                 }
                 decl.value = evalTemplate(subParts, variable => `\${:theme:${variable}}`);
             });
             const classDataCollector = createClassDataCollector(opts, moduleClass, themed, themeDefault, classData);
             const selectorParser = selectParser(classDataCollector);
             selectorParser.processSync(rule, { updateSelector: true });
             if (isDynamicRule(classData, moduleClass, classInfoes)) {
                 const id = addThemedRule(rulesMsg, classData, rule);
                 rule.replaceWith(postcss.comment({
                     text: COMMENT_PREFIX_FOR_THEMED_RULE + id,
                 }));
             }
         });
         let css = '';
         postcss.stringify(root, (text, node) => {
             if (node && node.type === 'comment' && node.text.startsWith(COMMENT_PREFIX_FOR_THEMED_RULE)) {
                 css += `\${:rule:${node.text.substring(COMMENT_PREFIX_FOR_THEMED_RULE.length)}}`;
             } else {
                 css += text;
             }
         });
         const [parts] = compileTemplate(css);
         sheetMsg.data = {
             parts,
             moduleClass,
             suffix,
             classInfoes,
             localsConvention,
         }
    }
});
