import { decideModuleClass, Options as PluginOptions } from "../../src/postcss/plugin";
import { textPart, variablePart } from '../../src/utils';
import { run } from './utils';

describe('base', () => {
    const opts: PluginOptions = {
        theme: {
            struct: {
                primaryColor: 'blue',
                secondaryColor: 'red',
                'backgroundColor': 'white',
            },
        },
    };
    it('should work with class themed rule', async () => {
        return run('.a { color: ${primaryColor}; }', opts)
            .then(({ rules, sheet: { parts, classInfoes} }) => {
                expect(rules).toEqual([{
                    classes: ['a'],
                    parts: [
                        textPart('.'),
                        variablePart(':class:a'),
                        textPart(' { color: '),
                        variablePart(':theme:primaryColor'),
                        textPart('; }'),
                    ],
                    vars: ['primaryColor'],
                }]);
                expect(parts).toEqual([variablePart(':rule:0')]);
                expect(classInfoes).toEqual({ a: { varName: 'a', themed: true }});
            })
            .catch(err => {
                fail(err);
            });
    });
    it('should work with no class themed rule', async () => {
        return run('span { color: ${primaryColor}; }', opts)
            .then(({ rules, sheet: { parts, classInfoes} }) => {
                const moduleClass = decideModuleClass(['a']);
                expect(rules).toEqual([{
                    classes: [moduleClass],
                    parts: [
                        textPart('.'),
                        variablePart(`:class:${moduleClass}`),
                        textPart(' span,span.'),
                        variablePart(`:class:${moduleClass}`),
                        textPart(' { color: '),
                        variablePart(':theme:primaryColor'),
                        textPart('; }'),
                    ],
                    vars: ['primaryColor'],
                }]);
                expect(parts).toEqual([variablePart(':rule:0')]);
                expect(classInfoes).toEqual({});
            })
            .catch(err => {
                fail(err);
            });
    });
    it('should work with class multi-variables themed rule', async () => {
        return run('.a { color: ${primaryColor}; background: ${backgroundColor}; }', opts)
            .then(({ rules, sheet: { parts, classInfoes} }) => {
                expect(rules).toEqual([{
                    classes: ['a'],
                    parts: [
                        textPart('.'),
                        variablePart(':class:a'),
                        textPart(' { color: '),
                        variablePart(':theme:primaryColor'),
                        textPart('; background: '),
                        variablePart(':theme:backgroundColor'),
                        textPart('; }'),
                    ],
                    vars: ['primaryColor', 'backgroundColor'],
                }]);
                expect(parts).toEqual([variablePart(':rule:0')]);
                expect(classInfoes).toEqual({ a: { varName: 'a', themed: true } });
            })
            .catch(err => {
                fail(err);
            });
    });
    it('should work with multi-class themed rule', async () => {
        return run('.a, .b { color: ${primaryColor}; }', opts)
            .then(({ rules, sheet: { parts, classInfoes} }) => {
                expect(rules).toEqual([{
                    classes: ['a', 'b'],
                    parts: [
                        textPart('.'),
                        variablePart(':class:a'),
                        textPart(', .'),
                        variablePart(':class:b'),
                        textPart(' { color: '),
                        variablePart(':theme:primaryColor'),
                        textPart('; }'),
                    ],
                    vars: ['primaryColor'],
                }]);
                expect(parts).toEqual([variablePart(':rule:0')]);
                expect(classInfoes).toEqual({
                    a: {
                        varName: 'a',
                        themed: true,
                    },
                    b: {
                        varName: 'b',
                        themed: true,
                    },
                });
            })
            .catch(err => {
                fail(err);
            });
    });
    it('should work with no-class themed rule', async () => {
        return run('div { color: ${primaryColor}; }', opts)
            .then(({ rules, sheet: { parts, classInfoes} }) => {
                const moduleClass = decideModuleClass([]);
                expect(rules).toEqual([{
                    classes: [moduleClass],
                    parts: [
                        textPart('.'),
                        variablePart(`:class:${moduleClass}`),
                        textPart(' div,div.'),
                        variablePart(`:class:${moduleClass}`),
                        textPart(' { color: '),
                        variablePart(':theme:primaryColor'),
                        textPart('; }'),
                    ],
                    vars: ['primaryColor'],
                }]);
                expect(parts).toEqual([variablePart(':rule:0')]);
                expect(classInfoes).toEqual({});
            })
            .catch(err => {
                fail(err);
            });
    });
    it('should work with no-class fix rule', async () => {
        return run('div { color: red; }', opts)
            .then(({ rules, sheet: { parts, classInfoes} }) => {
                expect(rules).toEqual([]);
                expect(parts).toEqual([textPart('div { color: red; }')]);
                expect(classInfoes).toEqual({});
            })
            .catch(err => {
                fail(err);
            });
    });
    it('should work with no-class themed rule and class themed rule', async () => {
        return run('div { color: ${primaryColor}; }\n .a { background: ${backgroundColor}; }', opts)
            .then(({ rules, sheet: { parts, classInfoes} }) => {
                const moduleClass = decideModuleClass(['a']);
                expect(rules).toEqual([
                    {
                        classes: [moduleClass],
                        parts: [
                            textPart('.'),
                            variablePart(`:class:${moduleClass}`),
                            textPart(' div,div.'),
                            variablePart(`:class:${moduleClass}`),
                            textPart(' { color: '),
                            variablePart(':theme:primaryColor'),
                            textPart('; }'),
                        ],
                        vars: ['primaryColor'],
                    },
                    {
                        classes: ['a'],
                        parts: [
                            textPart('.'),
                            variablePart(':class:a'),
                            textPart(' { background: '),
                            variablePart(':theme:backgroundColor'),
                            textPart('; }'),
                        ],
                        vars: ['backgroundColor'],
                    }
                ]);
                expect(parts).toEqual([
                    variablePart(':rule:0'),
                    textPart('\n '),
                    variablePart(':rule:1'),
                ]);
                expect(classInfoes).toEqual({ a: { varName: 'a', themed: true} });
            })
            .catch(err => {
                fail(err);
            });
    });
    it('should work with class not-themed rule', async () => {
        return run('.a { color: red; }', opts)
            .then(({ rules, sheet: { parts, classInfoes} }) => {
                expect(rules).toEqual([]);
                expect(parts).toEqual([
                    textPart('.'),
                    variablePart(':class:a'),
                    textPart(' { color: red; }'),
                ]);
                expect(classInfoes).toEqual({ a: { varName: 'a', themed: false } });
            })
            .catch(err => {
                fail(err);
            });
    });
});