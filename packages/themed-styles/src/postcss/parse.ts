import Input from 'postcss/lib/input';
import Parser from "./parser";

export default function (css: any, opts: any) {
  const input = new Input(css, opts);
  const parser = new Parser(input);
  parser.parse();
  return parser.root;
}