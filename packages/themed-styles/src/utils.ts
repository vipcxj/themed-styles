import { RuntimeTheme } from './config';

export const enum TemplatePartType {
    TEXT,
    VARIABLE,
}

export interface ITemplatePart {
    type: TemplatePartType;
    value: string;
}

export interface ITextTemplatePart extends ITemplatePart {
    type: TemplatePartType.TEXT;
}

export interface IVariableTemplatePart extends ITemplatePart {
    type: TemplatePartType.VARIABLE;
}

function collectVariable(template: string, pos: number): [number, number] {
    const beg = template.indexOf('${', pos);
    if (beg !== -1) {
        const end = template.indexOf('}', beg + 2);
        if (end !== -1) {
            return [beg, end];
        }
    }
    return [-1, -1];
}

export function textPart(text: string): ITextTemplatePart {
    return {
        type: TemplatePartType.TEXT,
        value: text,
    };
}

export function addTextToPart(parts: ITemplatePart[], text: string) {
    const lastPart = parts.length > 0 ? parts[parts.length - 1] : undefined;
    if (lastPart && lastPart.type === TemplatePartType.TEXT) {
        lastPart.value += text;
    } else {
        parts.push({
            type: TemplatePartType.TEXT,
            value: text,
        });
    }
}

export function variablePart(name: string): IVariableTemplatePart {
    return {
        type: TemplatePartType.VARIABLE,
        value: name,
    };
}

export function addVariableToPart(parts: ITemplatePart[], variable: string) {
    parts.push({
        type: TemplatePartType.VARIABLE,
        value: variable,
    });
}

export function addPart(parts: ITemplatePart[], part: ITemplatePart) {
    if (part.type === TemplatePartType.TEXT) {
        addTextToPart(parts, part.value);
    } else {
        parts.push(part);
    }
}

export function compileTemplate(template: string): [ITemplatePart[], string[]] {
    const parts: ITemplatePart[] = [];
    let pos = 0;
    let [beg, end] = collectVariable(template, pos);
    while (beg !== -1) {
        if (beg > pos) {
            const text = template.substring(pos, beg);
            addTextToPart(parts, text);
        }
        const variable = template.substring(beg + 2, end).trim();
        if (variable) {
            addVariableToPart(parts, variable);
        }
        pos = end + 1;
        [beg, end] = collectVariable(template, pos);
    }
    if (pos < template.length) {
        const text = template.substring(pos);
        addTextToPart(parts, text);
    }
    const deps = Array.from(new Set(parts.filter(part => part.type !== TemplatePartType.TEXT).map(part => part.value)));
    return [parts, deps];
}

export function evalTemplate(template: ITemplatePart[], themeOrBuilder: RuntimeTheme | ((variable: string) => string)) {
    let out = '';
    for (const part of template) {
        const { type, value } = part;
        if (type === TemplatePartType.TEXT) {
            out += value;
        } else if (typeof themeOrBuilder === 'function') {
            out += themeOrBuilder(value);
        } else {
            out += themeOrBuilder[value];
        }
    }
    return out;
}
