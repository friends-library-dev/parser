import { Parselet, TOKEN as t, NODE as n, Token, AstNode } from '../types';
import Node from '../nodes/AstNode';
import Parser from '../Parser';
import DiscoursePartIdentifierParser from '../parsers/DiscoursePartIdentifierParser';

const textParselet: Parselet = (parser, parent) => {
  if (parser.currentIs(t.DOT) && parser.current.column.start === 1) {
    parser.error(`line starting with dot not implemented`);
  }

  const discourseParser = new DiscoursePartIdentifierParser(parser);
  const discoursePartId = discourseParser.parse(parent);
  if (discoursePartId) {
    return discoursePartId;
  }

  const node = new Node(n.TEXT, parent, { value: parser.current.literal });
  if (parser.currentOneOf(t.WHITESPACE, t.EOL)) {
    node.value = ` `;
  }
  node.startToken = parser.consume();
  node.endToken = node.startToken;

  while (
    parser.currentOneOf(
      t.TEXT,
      t.WHITESPACE,
      t.EOL,
      t.COMMA,
      t.DOT,
      t.EXCLAMATION_MARK,
      t.LEFT_PARENS,
      t.RIGHT_PARENS,
      t.RIGHT_BRACKET,
      t.AMPERSAND,
    ) &&
    !parser.stopTokensFound()
  ) {
    const token = parser.consume();
    switch (token.type) {
      case t.WHITESPACE:
        node.value += ` `;
        break;
      case t.EOL:
        if (shouldConvertEolToSpace(parser, token)) {
          node.value += ` `;
        }
        break;
      default:
        node.value += token.literal;
        break;
    }
  }
  node.endToken = parser.lastSignificantToken();
  return node;
};

export default textParselet;

function shouldConvertEolToSpace(parser: Parser, token: Token): boolean {
  // final paragraph in blockquote should not have a trailing space
  if (parser.tokenIs(token, [t.UNDERSCORE, `____`])) {
    return false;
  }

  if (parser.currentIs(t.FOOTNOTE_PARAGRAPH_SPLIT)) {
    return false;
  }

  return true;
}
