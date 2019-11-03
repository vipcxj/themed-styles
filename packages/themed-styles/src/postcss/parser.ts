import BaseParser from 'postcss/lib/parser';
import tokenizer from './tokenize';

class Parser extends BaseParser {
    public createTokenizer(): any {
        this.tokenizer = tokenizer(this.input);
    }
}

export default Parser;