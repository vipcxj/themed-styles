import ready from 'document-ready';
import {RuntimeTheme, ThemeConfig, ThemedRule, ThemedSheet, ThemeProperty} from 'themed-styles';
import {ITemplatePart, TemplatePartType} from 'themed-styles/src/utils';

declare let global: any;
global = global || window || {};

let THEME_CONFIG: ThemeConfig;
try {
    // tslint:disable-next-line:no-var-requires
    THEME_CONFIG = require('themed-styles-theme-on-the-fly.json') as ThemeConfig;
} catch (e) {
    THEME_CONFIG = global.__THEME_CONFIG as ThemeConfig | undefined;
}
if (!THEME_CONFIG) {
    throw new Error('Unable to find the theme config, perhaps you do\'t use this library with the \'themed-styles\' webpack plugin.');
}
const THEME_KEYS = Object.keys(THEME_CONFIG);

function decideInnerName(names: string[], name: string, orgName: string): string {
    if (names.indexOf(name) < 0) {
        return name;
    } else {
        return decideInnerName(names, `_${name}`, orgName);
    }
}
const PROP_DATA = decideInnerName(THEME_KEYS, 'data', 'data');

interface NormThemeConfig {
    [key: string]: ThemeProperty;
}

function normalizeThemeConfig(): NormThemeConfig {
    const norm: NormThemeConfig = {};
    for (const key of THEME_KEYS) {
        const property = THEME_CONFIG[key];
        if (typeof property === 'string') {
            norm[key] = {
                defaultValue: property,
            };
        } else {
            norm[key] = property;
        }
    }
    return norm;
}

const NORM_THEME_CONFIG = normalizeThemeConfig();

function resolveDefaultTheme(): RuntimeTheme {
    const out: RuntimeTheme = {};
    for (const key of THEME_KEYS) {
        out[key] = NORM_THEME_CONFIG[key].defaultValue;
    }
    return out;
}
const DEFAULT_THEME = resolveDefaultTheme();

interface ThemeState {
    id: string;
    theme: RuntimeTheme;
    modules: string[];
}

export function createTheme(id: string, theme: RuntimeTheme): RuntimeTheme {
    const exist = getThemeState(id);
    if (exist) {
        throw new Error(`The theme ${id} has exist.`);
    }
    const newTheme: RuntimeTheme = {};
    Object.defineProperty(newTheme, PROP_DATA, {
        value: { ...DEFAULT_THEME },
    });
    const data = newTheme[PROP_DATA] as any;
    for (const key of Object.keys(theme)) {
        if (THEME_KEYS.indexOf(key) < 0) {
            throw new Error(`${key} is not defined in the theme config.`);
        }
        data[key] = theme[key];
    }
    for (const key of THEME_KEYS) {
        Object.defineProperty(newTheme, key, {
            enumerable: true,
            get(): any {
                return data[key];
            },
            set(v: any): void {
                data[key] = v;
                addJob({
                    type: 'themeChange',
                    themeId: id,
                });
            }
        });
    }
    THEMES.push({
        id,
        theme: newTheme,
        modules: [],
    });
    return newTheme;
}

export interface ClassMap {
    [varName: string]: string;
}

const filenameReservedRegex = /[<>:"/\\|?*\x00-\x1F]/g;
const reControlChars = /[\u0000-\u001f\u0080-\u009f]/g;
const reRelativePath = /^\.+/;

function getRealClassName(name: string, moduleId: string, suffix: string, themeId: string = '') {
    return `lc_${name}_${moduleId}_${themeId}${suffix}`
        .replace(/^((-?[0-9])|--)/, '_$1')
        .replace(filenameReservedRegex, '-')
        .replace(reControlChars, '-')
        .replace(reRelativePath, '-')
        .replace(/\./g, '-');
}

function evalTemplate(parts: ITemplatePart[], replacer: (varName: string) => string) {
    let out: string = '';
    for (const part of parts) {
        if (part.type === TemplatePartType.TEXT) {
            out += part.value;
        } else {
            out += replacer(part.value);
        }
    }
    return out;
}

export class Styles {
    public static STYLES_LIST: Styles[] = [];
    public static getStyles(id: string): Styles | undefined {
        for (const info of this.STYLES_LIST) {
            if (info.id === id) {
                return info;
            }
        }
        return undefined;
    }
    public static registerStyles(id: string, rules: ThemedRule[], sheet: ThemedSheet) {
        let styles = this.getStyles(id);
        if (styles) {
            throw new Error(`The styles ${id} exists.`);
        }
        styles = new Styles(id, rules, sheet);
        this.STYLES_LIST.push(styles);
        styles.useTheme();
        return styles;
    }
    public id: string;
    public rules: ThemedRule[];
    public sheet: ThemedSheet;
    private node: HTMLStyleElement;
    private classMaps: { [themeId: string]: [string, ClassMap] } = {};
    constructor(id: string, rules: ThemedRule[], sheet: ThemedSheet) {
        this.id = id;
        this.rules = rules;
        this.sheet = sheet;
        this.prepareSheet();
    }
    public useTheme(id: string = ''): [string, ClassMap] {
        const themeState = getThemeState(id);
        if (!themeState) {
            throw new Error(`No such theme with id: ${id}.`);
        }
        const { modules } = themeState;
        let classMap = this.classMaps[id];
        if (!classMap) {
            classMap = [getRealClassName(this.sheet.moduleClass, this.id, this.sheet.suffix, id), this.genClassMap(id)];
            this.classMaps[id] = classMap;
        }
        if (modules.indexOf(this.id) < 0) {
            modules.push(this.id);
            addJob({
                type: 'moduleInit',
                moduleId: this.id,
            });
        }
        return classMap;
    }
    public render() {
        const rules: string[] = this.rules.map(({ parts }) => {
            let css = '';
            for (const themeId of Object.keys(this.classMaps)) {
                const state = getThemeState(themeId);
                const { theme } = state;
                css += evalTemplate(parts, varName => {
                    if (varName.startsWith(':class:')) {
                        const name = varName.substring(7).trim();
                        return getRealClassName(name, this.id, this.sheet.suffix, themeId);
                    } else if (varName.startsWith(':theme:')) {
                        const name = varName.substring(7).trim();
                        return theme[name];
                    } else {
                        return `\${${varName}}`;
                    }
                }) + '\n';
            }
            return css;
        });
        if (!this.node) {
            this.node = document.createElement('style');
            this.node.id = this.id;
            this.node.setAttribute('type', 'text/css');
            document.head.appendChild(this.node);
        }
        this.node.innerHTML = evalTemplate(this.sheet.parts, varName => {
            if (varName.startsWith(':class:')) {
                const name = varName.substring(7).trim();
                return getRealClassName(name, this.id, this.sheet.suffix, '');
            } else if (varName.startsWith(':rule:')) {
                const idx = Number.parseInt(varName.substring(6).trim(), 10);
                return rules[idx];
            } else {
                return `\${${varName}}`;
            }
        });
    }
    private prepareSheet() {
        const { id, sheet } = this;
        const { parts, suffix } = sheet;
        const newParts: ITemplatePart[] = [];
        // tslint:disable-next-line:no-unnecessary-initializer
        let current: ITemplatePart = undefined;
        for (const part of parts) {
            if (!current) {
                const { type, value } = part;
                if (type === TemplatePartType.VARIABLE && value.startsWith(':class:')) {
                    const name = value.substring(7).trim();
                    const clsName = getRealClassName(name, id, suffix);
                    const newPart = {
                        type: TemplatePartType.TEXT,
                        value: clsName,
                    };
                    newParts.push(newPart);
                    current = newPart;
                } else {
                    newParts.push(part);
                    current = part;
                }
            } else {
                const { type, value } = part;
                if (type === TemplatePartType.TEXT) {
                    if (current.type === TemplatePartType.TEXT) {
                        current.value += value;
                    } else {
                        newParts.push(part);
                        current = part;
                    }
                } else {
                    if (value.startsWith(':class:')) {
                        const name = value.substring(7).trim();
                        const clsName = getRealClassName(name, id, suffix);
                        if (current.type === TemplatePartType.TEXT) {
                            current.value += clsName;
                        } else {
                            newParts.push({
                                type: TemplatePartType.TEXT,
                                value: clsName,
                            });
                            current = part;
                        }
                    } else if (value.startsWith(':rule:')) {
                        newParts.push(part);
                        current = part;
                    } else {
                        throw new Error('This is impossible!');
                    }
                }
            }
        }
        sheet.parts = newParts;
    }
    private genClassMap(themeId: string): ClassMap {
        const { id, sheet } = this;
        const { localsConvention, suffix, classInfoes } = sheet;
        const notKeepOrg = localsConvention === 'camelCaseOnly' || 'dashesOnly';
        const map: ClassMap = {};
        for (const name of Object.keys(classInfoes)) {
            const cInfo = classInfoes[name];
            const { varName } = cInfo;
            const realClassName = getRealClassName(name, id, suffix, themeId);
            map[varName] = realClassName;
            if (!notKeepOrg && name !== varName) {
                map[name] = realClassName;
            }
        }
        return map;
    }
}

interface BaseJob {
    type: string;
}

interface ModuleInitJob extends BaseJob {
    type: 'moduleInit';
    moduleId: string;
}

interface ThemeChangeJob extends BaseJob {
    type: 'themeChange';
    themeId: string;
}

type Job = ModuleInitJob | ThemeChangeJob;

const THEMES: ThemeState[] = [];
const JOBS: Job[] = [];
const EARLY_JOBS: Job[] = [];
const nextFrame = (global.requestAnimationFrame as typeof requestAnimationFrame) || setTimeout;
function getThemeState(id: string = ''): ThemeState | undefined {
    for (const theme of THEMES) {
        if (theme.id === id) {
            return theme;
        }
    }
    return undefined;
}
function addJob(job: Job) {
    if (ready) {
        JOBS.push(job);
        nextFrame(() => {
            doWork(JOBS);
        })
    } else {
        EARLY_JOBS.push(job);
    }
}

let DOM_READY: boolean = false;
ready(() => {
    DOM_READY = true;
    doWork(EARLY_JOBS);
});

function processJobs(jobs: Job[]): string[]  {
    const modules: string[] = [];
    const addModules = (ms: string[]) => {
        for (const m of ms) {
            if (modules.indexOf(m) < 0) {
                modules.push(m);
            }
        }
    };
    for (const job of jobs) {
        if (job.type === 'moduleInit') {
            const { moduleId } = job;
            addModules([moduleId]);
        } else {
            const { themeId } = job;
            const state = getThemeState(themeId);
            if (!state) {
                throw new Error(`Unable to find the theme state with id ${themeId}`);
            }
            addModules(state.modules);
        }
    }
    return modules;
}

function doWork(jobs: Job[]) {
    const modules = processJobs(jobs);
    for (const moduleId of modules) {
        const styles = Styles.getStyles(moduleId);
        if (!styles) {
            throw new Error(`Unable to find the styles with id: ${moduleId}.`);
        }
        styles.render();
    }
    jobs.length = 0;
}

createTheme('', DEFAULT_THEME);