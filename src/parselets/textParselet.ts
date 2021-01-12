import TextNode from '../nodes/TextNode';
import { Parselet, TOKEN as t } from '../types';

const textParselet: Parselet = (parser, parent) => {
  const node = new TextNode(
    parent,
    parser.current.type === t.WHITESPACE ? ` ` : parser.current.literal,
  );
  parser.consume();

  while (
    parser.currentOneOf(t.TEXT, t.WHITESPACE, t.EOL, t.COMMA) &&
    !parser.stopTokensFound()
  ) {
    const token = parser.consume();
    switch (token.type) {
      case t.WHITESPACE:
        node.value += ` `;
        break;
      case t.EOL:
        // final paragraph in blockquote should not have a trailing space
        if (!parser.currentIs([t.UNDERSCORE, `____`])) {
          node.value += ` `;
        }
        break;
      default:
        node.value += token.literal;
        break;
    }
  }
  return node;
};

export default textParselet;
