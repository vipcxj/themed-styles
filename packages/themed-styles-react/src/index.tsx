import constate from "constate";
import React from 'react';

function useThemeState({ initTheme = '' }) {
    const [theme, setTheme] = React.useState(initTheme);
    return { theme, setTheme };
}

const themeContext = constate(
    useThemeState,
    value => value.theme,
    value => value.setTheme,
);
export const [ThemeProvider, useTheme, useSetTheme] = themeContext;
export const ThemeConsumer = themeContext.Context.Consumer;