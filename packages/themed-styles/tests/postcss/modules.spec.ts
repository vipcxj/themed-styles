import { Options as PluginOptions } from "../../src/postcss/plugin";
import { textPart, variablePart } from '../../src/utils';
import { run } from './utils';

const modulesSet: Array<undefined | 'local' | true> = [undefined, 'local', true];
for (const modules of modulesSet) {
    const opts: PluginOptions = {
        modules,
    };
    describe(`modules = ${modules} `, () => {
        it('should unchanged with empty style and without class', async () => {
            return run('div {}', opts)
                .then(({css, rules, sheet}) => {
                    const { parts, classInfoes } = sheet;
                    expect(css).toEqual('div {}');
                    expect(rules).toEqual([]);
                    expect({ parts, classInfoes }).toEqual({
                        parts: [textPart('div {}')],
                        classInfoes: {},
                    });
                });
        });
        it('should unchanged with empty style and class', async () => {
            return run('.a {}', opts)
                .then(({rules, sheet}) => {
                    const { parts, classInfoes } = sheet;
                    expect(rules).toEqual([]);
                    expect({ parts, classInfoes }).toEqual({
                        parts: [
                            textPart('.'),
                            variablePart(':class:a'),
                            textPart(' {}'),
                        ],
                        classInfoes: {
                            a: {
                                varName: 'a',
                                themed: false,
                            },
                        },
                    });
                });
        });
        it('explicit global directive class', async () => {
            return run(':global .a {}', opts)
                .then(({css, rules, sheet}) => {
                    const { parts, classInfoes } = sheet;
                    expect(css).toEqual(' .a {}');
                    expect(rules).toEqual([]);
                    expect({ parts, classInfoes }).toEqual({
                        parts: [textPart(' .a {}')],
                        classInfoes: {},
                    });
                });
        });
        it('explicit local directive class', async () => {
            return run(':local .a {}', opts)
                .then(({rules, sheet}) => {
                    const { parts, classInfoes } = sheet;
                    expect(rules).toEqual([]);
                    expect({ parts, classInfoes }).toEqual({
                        parts: [textPart(' .'), variablePart(':class:a'), textPart(' {}')],
                        classInfoes: {
                            a: {
                                varName: 'a',
                                themed: false,
                            }
                        }
                    });
                });
        });
        it('explicit global function class', async () => {
            return run(':global(.a) {}', opts)
                .then(({css, rules, sheet}) => {
                    const { parts, classInfoes } = sheet;
                    expect(css).toEqual('.a {}');
                    expect(rules).toEqual([]);
                    expect({ parts, classInfoes }).toEqual({
                        parts: [textPart('.a {}')],
                        classInfoes: {},
                    });
                });
        });
        it('explicit local function class', async () => {
            return run(':local(.a) {}', opts)
                .then(({rules, sheet}) => {
                    const { parts, classInfoes } = sheet;
                    expect(rules).toEqual([]);
                    expect({ parts, classInfoes }).toEqual({
                        parts: [textPart('.'), variablePart(':class:a'), textPart(' {}')],
                        classInfoes: {
                            a: {
                                varName: 'a',
                                themed: false,
                            },
                        },
                    });
                });
        });
        it('mix default, global and local 1', async () => {
            return run('.a :local(.b) :global(.c) {}', opts)
                .then(({rules, sheet}) => {
                    const { parts, classInfoes } = sheet;
                    expect(rules).toEqual([]);
                    expect({ parts, classInfoes }).toEqual({
                        parts: [
                            textPart('.'),
                            variablePart(':class:a'),
                            textPart(' .'),
                            variablePart(':class:b'),
                            textPart(' .c {}')
                        ],
                        classInfoes: {
                            a: {
                                varName: 'a',
                                themed: false,
                            },
                            b: {
                                varName: 'b',
                                themed: false,
                            },
                        }
                    });
                });
        });
        it('mix default, global and local 2', async () => {
            return run(':local .a :global(.b) .c {}', opts)
                .then(({rules, sheet}) => {
                    const { parts, classInfoes } = sheet;
                    expect(rules).toEqual([]);
                    expect({ parts, classInfoes }).toEqual({
                        parts: [
                            textPart(' .'),
                            variablePart(':class:a'),
                            textPart(' .b .'),
                            variablePart(':class:c'),
                            textPart(' {}')
                        ],
                        classInfoes: {
                            a: {
                                varName: 'a',
                                themed: false,
                            },
                            c: {
                                varName: 'c',
                                themed: false,
                            },
                        },
                    });
                });
        });
        it('mix default, global and local 3', async () => {
            return run(':global .a :local(.b) .c {}', opts)
                .then(({rules, sheet}) => {
                    const { parts, classInfoes } = sheet;
                    expect(rules).toEqual([]);
                    expect({ parts, classInfoes }).toEqual({
                        parts: [
                            textPart(' .a .'),
                            variablePart(':class:b'),
                            textPart(' .c {}'),
                        ],
                        classInfoes: {
                            b: {
                                varName: 'b',
                                themed: false,
                            },
                        },
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
                const { parts, classInfoes } = sheet;
                expect(css).toEqual('div {}');
                expect(rules).toEqual([]);
                expect({ parts, classInfoes}).toEqual({
                    parts: [textPart('div {}')],
                    classInfoes: {},
                });
            });
    });
    it('should unchanged with empty style and class', async () => {
        return run('.a {}', opts)
            .then(({ css, rules, sheet }) => {
                const { parts, classInfoes } = sheet;
                expect(css).toEqual('.a {}');
                expect(rules).toEqual([]);
                expect({ parts, classInfoes}).toEqual({
                    parts: [textPart('.a {}')],
                    classInfoes: {},
                });
            });
    });
    it('explicit global directive class', async () => {
        return run(':global .a {}', opts)
            .then(({ css, rules, sheet }) => {
                const { parts, classInfoes } = sheet;
                expect(css).toEqual(' .a {}');
                expect(rules).toEqual([]);
                expect({ parts, classInfoes }).toEqual({
                    parts: [textPart(' .a {}')],
                    classInfoes: {},
                });
            });
    });
    it('explicit local directive class', async () => {
        return run(':local .a {}', opts)
            .then(({ rules, sheet }) => {
                const { parts, classInfoes } = sheet;
                expect(rules).toEqual([]);
                expect({ parts, classInfoes }).toEqual({
                    parts: [textPart(' .'), variablePart(':class:a'), textPart(' {}')],
                    classInfoes: {
                        a: {
                            varName: 'a',
                            themed: false,
                        }
                    }
                });
            });
    });
    it('explicit global function class', async () => {
        return run(':global(.a) {}', opts)
            .then(({ css, rules, sheet }) => {
                const { parts, classInfoes } = sheet;
                expect(css).toEqual('.a {}');
                expect(rules).toEqual([]);
                expect({ parts, classInfoes }).toEqual({
                    parts: [textPart('.a {}')],
                    classInfoes: {},
                });
            });
    });
    it('explicit local function class', async () => {
        return run(':local(.a) {}', opts)
            .then(({ rules, sheet }) => {
                const { parts, classInfoes } = sheet;
                expect(rules).toEqual([]);
                expect({ parts, classInfoes }).toEqual({
                    parts: [textPart('.'), variablePart(':class:a'), textPart(' {}')],
                    classInfoes: {
                        a: {
                            varName: 'a',
                            themed: false,
                        },
                    },
                });
            });
    });
    it('mix default, global and local 1', async () => {
        return run('.a :local(.b) :global(.c) {}', opts)
            .then(({ rules, sheet }) => {
                const { parts, classInfoes } = sheet;
                expect(rules).toEqual([]);
                expect({ parts, classInfoes }).toEqual({
                    parts: [
                        textPart('.a .'),
                        variablePart(':class:b'),
                        textPart(' .c {}')
                    ],
                    classInfoes: {
                        b: {
                            varName: 'b',
                            themed: false,
                        },
                    },
                });
            });
    });
    it('mix default, global and local 2', async () => {
        return run(':local .a :global(.b) .c {}', opts)
            .then(({ rules, sheet }) => {
                const { parts, classInfoes } = sheet;
                expect(rules).toEqual([]);
                expect({ parts, classInfoes }).toEqual({
                    parts: [
                        textPart(' .'),
                        variablePart(':class:a'),
                        textPart(' .b .'),
                        variablePart(':class:c'),
                        textPart(' {}')
                    ],
                    classInfoes: {
                        a: {
                            varName: 'a',
                            themed: false,
                        },
                        c: {
                            varName: 'c',
                            themed: false,
                        },
                    },
                });
            });
    });
    it('mix default, global and local 3', async () => {
        return run(':global .a :local(.b) .c {}', opts)
            .then(({ rules, sheet }) => {
                const { parts, classInfoes } = sheet;
                expect(rules).toEqual([]);
                expect({ parts, classInfoes }).toEqual({
                    parts: [
                        textPart(' .a .'),
                        variablePart(':class:b'),
                        textPart(' .c {}'),
                    ],
                    classInfoes: {
                        b: {
                            varName: 'b',
                            themed: false,
                        },
                    },
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
                const { parts, classInfoes } = sheet;
                expect(css).toEqual('div {}');
                expect(rules).toEqual([]);
                expect({ parts, classInfoes }).toEqual({
                    parts: [textPart('div {}')],
                    classInfoes: {},
                });
            });
    });
    it('should unchanged with empty style and class', async () => {
        return run('.a {}', opts)
            .then(({ css, rules, sheet }) => {
                const { parts, classInfoes } = sheet;
                expect(css).toEqual('.a {}');
                expect(rules).toEqual([]);
                expect({ parts, classInfoes }).toEqual({
                    parts: [textPart('.a {}')],
                    classInfoes: {},
                });
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