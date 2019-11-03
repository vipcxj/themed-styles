import postcss from 'postcss';
import * as cases from 'postcss-parser-tests';
import parser, { ClassName, Root } from 'postcss-selector-parser';
import parse from '../../src/postcss/parse';
import { normJson } from '../utils'
import { each } from "./utils";

describe('official without variable', () => {
    cases.each((name, css, ideal) => {
        it(`test ast of ${name}`, () => {
            const parsed = cases.jsonify(parse(css, { from: name }));
            expect(parsed).toEqual(ideal);
        });
    });
});

describe('with variable', () => {
    each(
        (file) => file.endsWith('.css') && !file.endsWith('.expect.css'),
        (file) => file.slice(0, file.length - 4) + '.json',
        (name, content, ast) => {
            it(`test ast of ${name}`, () => {
                expect(cases.jsonify(parse(content, { from: name }))).toEqual(normJson(ast));
            })
        }
    );
    it('test aaa', async () => {
        const processor1 = (root: Root) => {
            root.walkClasses((className: ClassName) => {
                className.setPropertyWithoutEscape('value', `\${${className.value}}`);
            });
        };
        const processor2 = (root: Root) => {
            root.walkClasses((className: ClassName) => {
                if (className.value && className.value.startsWith('${')) {
                    className.value = className.value.substring(2, className.value.length - 1);
                }
            });
        };
        const selectorProcessor1 = parser(processor1);
        const selectorProcessor2 = parser(processor2);
        const plugin = postcss.plugin<{}>('test1', () => root => {
            root.walkRules(rule => {
                selectorProcessor1.processSync(rule, { updateSelector: true });
            });
        });
        const plugin2 = postcss.plugin<{}>('test2', () => root => {
            root.walkRules(rule => {
                selectorProcessor2.processSync(rule, { updateSelector: true });
            });
        });
        const css0 = 'div.a > .b {}';
        let result = await postcss(plugin()).process(css0, { parser: parse });
        const css1 = result.css;
        expect(css1).toEqual('div.${a} > .${b} {}');
        result = await postcss(plugin2).process(css1, { parser: parse });
        expect(result.css).toEqual(css0);
        result = await postcss([plugin, plugin2]).process(css0, { parser: parse });
        expect(result.css).toEqual(css0);
    })
});