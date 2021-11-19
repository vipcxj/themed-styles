import compiler from './compiler';
import tsTheme from './theme.config';
import defaultTheme from './theme.config.json';

describe('plugin test', () => {
    it('should use theme.config.json by default', async () => {
        const { stats, output } = await compiler({
            path: './entry.js',
            content: `
                export default require('themed-styles-theme-on-the-fly.json');
            `,
        }, {
            plugin: true,
            loader: true,
        });
        expect(stats.hasErrors()).toEqual(false);
        expect(output).toEqual(defaultTheme);
        return;
    });
    it('should use input theme object', async () => {
        const { stats, output } = await compiler({
            path: './entry.js',
            content: `const styles = require('a.tcss').default; export default styles;`,
        }, {
            plugin: { theme: tsTheme },
            loader: true,
            files: [
                { path: 'node_modules/a.tcss', content: '.a { color: ${primaryColor}; }' }
            ]
        });
        expect(stats.hasErrors()).toEqual(false);
        expect(output.useTheme()).toEqual(['lc_defaultModuleClass_592__', { a: 'lc_a_592__' }]);
        return;
    });
});