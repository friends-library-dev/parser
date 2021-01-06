import TextNode from '../nodes/TextNode';
import { Parselet, TOKEN as t } from '../types';

const textParselet: Parselet = (parser, parent) => {
  const node = new TextNode(
    parent,
    parser.current.type === t.WHITESPACE ? ` ` : parser.current.literal,
  );
  parser.consume();

  while ([t.TEXT, t.WHITESPACE].includes(parser.current.type as any)) {
    const token = parser.consume();
    node.value += token.type === t.WHITESPACE ? ` ` : token.literal;
  }
  return node;
};

export default textParselet;
