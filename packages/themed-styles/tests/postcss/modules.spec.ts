import { Options as PluginOptions } from "../../src/postcss/plugin";
import { textPart, variablePart } from '../../src/utils';
import { run, toSheet } from './utils';

const modulesSet: Array<undefined | 'local' | true> = [undefined, 'local', true];
for (const modules of modulesSet) {
    const opts: PluginOptions = {
        modules,
    };
    describe(`modules = ${modules} `, () => {
        it('should unchanged with empty style and without class', async () => {
            return run('div {}', opts)
                .then(({css, rules, sheet}) => {
                    expect(css).toEqual('div {}');
                    expect(rules).toEqual([]);
                    expect(sheet).toEqual(toSheet('div {}'));
                });
        });
        it('should unchanged with empty style and class', async () => {
            return run('.a {}', opts)
                .then(({rules, sheet}) => {
                    expect(rules).toEqual([{
                        classes: ['a'],
                        parts: [
                            textPart('.'),
                            variablePart(':class:a'),
                            textPart(' {}'),
                        ],
                        vars: [],
                    }]);
                    expect(sheet).toEqual({
                        parts: [variablePart(':rule:0')],
                        vars: [],
                    });
                });
        });
        it('explicit global directive class', async () => {
            return run(':global .a {}', opts)
                .then(({css, rules, sheet}) => {
                    expect(css).toEqual(' .a {}');
                    expect(rules).toEqual([]);
                    expect(sheet).toEqual(toSheet(' .a {}'));
                });
        });
        it('explicit local directive class', async () => {
            return run(':local .a {}', opts)
                .then(({rules, sheet}) => {
                    expect(rules).toEqual([{
                        classes: ['a'],
                        parts: [textPart(' .'), variablePart(':class:a'), textPart(' {}')],
                        vars: [],
                    }]);
                    expect(sheet).toEqual({
                        parts: [variablePart(':rule:0')],
                        vars: [],
                    });
                });
        });
        it('explicit global function class', async () => {
            return run(':global(.a) {}', opts)
                .then(({css, rules, sheet}) => {
                    expect(css).toEqual('.a {}');
                    expect(rules).toEqual([]);
                    expect(sheet).toEqual(toSheet('.a {}'));
                });
        });
        it('explicit local function class', async () => {
            return run(':local(.a) {}', opts)
                .then(({rules, sheet}) => {
                    expect(rules).toEqual([{
                        classes: ['a'],
                        parts: [textPart('.'), variablePart(':class:a'), textPart(' {}')],
                        vars: [],
                    }]);
                    expect(sheet).toEqual({
                        parts: [variablePart(':rule:0')],
                        vars: [],
                    });
                });
        });
        it('mix default, global and local 1', async () => {
            return run('.a :local(.b) :global(.c) {}', opts)
                .then(({rules, sheet}) => {
                    expect(rules).toEqual([{
                        classes: ['a', 'b'],
                        parts: [
                            textPart('.'),
                            variablePart(':class:a'),
                            textPart(' .'),
                            variablePart(':class:b'),
                            textPart(' .c {}')],
                        vars: [],
                    }]);
                    expect(sheet).toEqual({
                        parts: [variablePart(':rule:0')],
                        vars: [],
                    });
                });
        });
        it('mix default, global and local 2', async () => {
            return run(':local .a :global(.b) .c {}', opts)
                .then(({rules, sheet}) => {
                    expect(rules).toEqual([{
                        classes: ['a', 'c'],
                        parts: [
                            textPart(' .'),
                            variablePart(':class:a'),
                            textPart(' .b .'),
                            variablePart(':class:c'),
                            textPart(' {}')],
                        vars: [],
                    }]);
                    expect(sheet).toEqual({
                        parts: [variablePart(':rule:0')],
                        vars: [],
                    });
                });
        });
        it('mix default, global and local 3', async () => {
            return run(':global .a :local(.b) .c {}', opts)
                .then(({rules, sheet}) => {
                    expect(rules).toEqual([{
                        classes: ['b'],
                        parts: [
                            textPart(' .a .'),
                            variablePart(':class:b'),
                            textPart(' .c {}'),
                        ],
                        vars: [],
                    }]);
                    expect(sheet).toEqual({
                        parts: [variablePart(':rule:0')],
                        vars: [],
                    });
                });
        });
    });
}

describe('modules = global',() => {
    const opts: PluginOptions = {
        modules: 'global',
    };
    it('should unchanged with empty style and without class', async () => {
        return run('div {}', opts)
            .then(({ css, rules, sheet }) => {
                expect(css).toEqual('div {}');
                expect(rules).toEqual([]);
                expect(sheet).toEqual(toSheet('div {}'));
            });
    });
    it('should unchanged with empty style and class', async () => {
        return run('.a {}', opts)
            .then(({ css, rules, sheet }) => {
                expect(css).toEqual('.a {}');
                expect(rules).toEqual([]);
                expect(sheet).toEqual(toSheet('.a {}'));
            });
    });
    it('explicit global directive class', async () => {
        return run(':global .a {}', opts)
            .then(({ css, rules, sheet }) => {
                expect(css).toEqual(' .a {}');
                expect(rules).toEqual([]);
                expect(sheet).toEqual(toSheet(' .a {}'));
            });
    });
    it('explicit local directive class', async () => {
        return run(':local .a {}', opts)
            .then(({ rules, sheet }) => {
                expect(rules).toEqual([{
                    classes: ['a'],
                    parts: [textPart(' .'), variablePart(':class:a'), textPart(' {}')],
                    vars: [],
                }]);
                expect(sheet).toEqual({
                    parts: [variablePart(':rule:0')],
                    vars: [],
                });
            });
    });
    it('explicit global function class', async () => {
        return run(':global(.a) {}', opts)
            .then(({ css, rules, sheet }) => {
                expect(css).toEqual('.a {}');
                expect(rules).toEqual([]);
                expect(sheet).toEqual(toSheet('.a {}'));
            });
    });
    it('explicit local function class', async () => {
        return run(':local(.a) {}', opts)
            .then(({ rules, sheet }) => {
                expect(rules).toEqual([{
                    classes: ['a'],
                    parts: [textPart('.'), variablePart(':class:a'), textPart(' {}')],
                    vars: [],
                }]);
                expect(sheet).toEqual({
                    parts: [variablePart(':rule:0')],
                    vars: [],
                });
            });
    });
    it('mix default, global and local 1', async () => {
        return run('.a :local(.b) :global(.c) {}', opts)
            .then(({ rules, sheet }) => {
                expect(rules).toEqual([{
                    classes: ['b'],
                    parts: [
                        textPart('.a .'),
                        variablePart(':class:b'),
                        textPart(' .c {}')],
                    vars: [],
                }]);
                expect(sheet).toEqual({
                    parts: [variablePart(':rule:0')],
                    vars: [],
                });
            });
    });
    it('mix default, global and local 2', async () => {
        return run(':local .a :global(.b) .c {}', opts)
            .then(({ rules, sheet }) => {
                expect(rules).toEqual([{
                    classes: ['a', 'c'],
                    parts: [
                        textPart(' .'),
                        variablePart(':class:a'),
                        textPart(' .b .'),
                        variablePart(':class:c'),
                        textPart(' {}')],
                    vars: [],
                }]);
                expect(sheet).toEqual({
                    parts: [variablePart(':rule:0')],
                    vars: [],
                });
            });
    });
    it('mix default, global and local 3', async () => {
        return run(':global .a :local(.b) .c {}', opts)
            .then(({ rules, sheet }) => {
                expect(rules).toEqual([{
                    classes: ['b'],
                    parts: [
                        textPart(' .a .'),
                        variablePart(':class:b'),
                        textPart(' .c {}'),
                    ],
                    vars: [],
                }]);
                expect(sheet).toEqual({
                    parts: [variablePart(':rule:0')],
                    vars: [],
                });
            });
    });
});

describe('modules = false',() => {
    const opts: PluginOptions = {
        modules: false,
    };
    it('should unchanged with empty style and without class', async () => {
        return run('div {}', opts)
            .then(({ css, rules, sheet }) => {
                expect(css).toEqual('div {}');
                expect(rules).toEqual([]);
                expect(sheet).toEqual(toSheet('div {}'));
            });
    });
    it('should unchanged with empty style and class', async () => {
        return run('.a {}', opts)
            .then(({ css, rules, sheet }) => {
                expect(css).toEqual('.a {}');
                expect(rules).toEqual([]);
                expect(sheet).toEqual(toSheet('.a {}'));
            });
    });
    it('explicit global directive class', async () => {
        return run(':global .a {}', opts)
            .catch(err => {
                expect(err.reason).toEqual('The local and global pseudo are not allowed with modules \'false\'.');
            })
    });
    it('explicit local directive class', async () => {
        return run(':local .a {}', opts)
            .catch(err => {
                expect(err.reason).toEqual('The local and global pseudo are not allowed with modules \'false\'.');
            })
    });
    it('explicit global function class', async () => {
        return run(':global(.a) {}', opts)
            .catch(err => {
                expect(err.reason).toEqual('The local and global pseudo are not allowed with modules \'false\'.');
            })
    });
    it('explicit local function class', async () => {
        return run(':local(.a) {}', opts)
            .catch(err => {
                expect(err.reason).toEqual('The local and global pseudo are not allowed with modules \'false\'.');
            })
    });
    it('mix default, global and local 1', async () => {
        return run('.a :local(.b) :global(.c) {}', opts)
            .catch(err => {
                expect(err.reason).toEqual('The local and global pseudo are not allowed with modules \'false\'.');
            })
    });
    it('mix default, global and local 2', async () => {
        return run(':local .a :global(.b) .c {}', opts)
            .catch(err => {
                expect(err.reason).toEqual('The local and global pseudo are not allowed with modules \'false\'.');
            })
    });
    it('mix default, global and local 3', async () => {
        return run(':global .a :local(.b) .c {}', opts)
            .catch(err => {
                expect(err.reason).toEqual('The local and global pseudo are not allowed with modules \'false\'.');
            })
    });
});