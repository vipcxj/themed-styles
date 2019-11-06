import postcss, {LazyResult, ParserInput, Result, Root} from "postcss";
import parser from '../../src/postcss/parse';
import plugin, {
    getThemedRulesMessage,
    getThemedSheetMessage,
    Options as PluginOptions
} from "../../src/postcss/plugin";
import { compileTemplate } from "../../src/utils";
import { Callback, each as baseEach, MatchedFile, TargetFilter } from '../utils';

export function each(targetFilter: TargetFilter, toMatchFile: MatchedFile, callback: Callback) {
    return baseEach(__dirname, targetFilter, toMatchFile, callback);
}

export async function run(input: ParserInput | Result | LazyResult | Root, opts: PluginOptions) {
    return postcss(plugin(opts)).process(input, { from: undefined, to: undefined, parser }).then(({ css, messages }) => ({
        css,
        rules: getThemedRulesMessage(messages).data,
        sheet: getThemedSheetMessage(messages).data,
    }));
}