import React from 'react';
import TestRender from 'react-test-renderer';
import { ThemeProvider, useSetTheme, useTheme } from '../src';

function A1() {
    return <>useTheme()</>;
}

function A2() {
    return <>useTheme()</>;
}

function A3() {
    return <>useTheme()</>;
}

function B1() {
    return <>useTheme()</>;
}

function B2() {
    return <>useTheme()</>;
}

function A() {
    return (
        <ThemeProvider initTheme={'a'}>
            <A1/>
            <A2/>
            <A3/>
        </ThemeProvider>
    )
}

function B() {
    return (
        <>
            <B1/>
            <B2/>
        </>
    )
}

function Root() {
    return (
        <ThemeProvider>
            <div>
                <A/>
                <B/>
            </div>
        </ThemeProvider>
    )
}

it('a test', () => {
    const node = TestRender.create(<Root/>);
    // tslint:disable-next-line:no-console
    console.log(node.toJSON());
});