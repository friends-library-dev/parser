import Node from '../nodes/AstNode';
import { Parselet, TOKEN as t, NODE as n } from '../types';

const textParselet: Parselet = (parser, parent) => {
  const node = new Node(n.TEXT, parent, { value: parser.current.literal });
  if (parser.currentOneOf(t.WHITESPACE, t.EOL)) {
    node.value = ` `;
  }
  parser.consume();

  while (
    parser.currentOneOf(
      t.TEXT,
      t.WHITESPACE,
      t.EOL,
      t.COMMA,
      t.DOT,
      t.LEFT_PARENS,
      t.RIGHT_PARENS,
      t.RIGHT_BRACKET,
    ) &&
    !parser.stopTokensFound()
  ) {
    const token = parser.consume();
    switch (token.type) {
      case t.WHITESPACE:
        node.value += ` `;
        break;
      case t.EOL:
        // final paragraph in blockquote should not have a trailing space
        if (!parser.tokenIs(token, [t.UNDERSCORE, `____`])) {
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
