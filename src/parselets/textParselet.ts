import { Parselet, TOKEN as t, NODE as n, Token, AstNode } from '../types';
import Node from '../nodes/AstNode';
import Parser from '../Parser';
import DiscoursePartIdentifierParser from '../parsers/DiscoursePartIdentifierParser';
import PostscriptIdentifierParser from '../parsers/PostscriptIdentifierParser';

const textParselet: Parselet = (parser, parent) => {
  if (parser.currentIs(t.DOT) && parser.current.column.start === 1) {
    parser.throwError(`line starting with dot not implemented`);
  }

  const discourseParser = new DiscoursePartIdentifierParser(parser);
  const discoursePartId = discourseParser.parse(parent);
  if (discoursePartId) {
    return discoursePartId;
  }

  const psParser = new PostscriptIdentifierParser(parser);
  const psId = psParser.parse(parent);
  if (psId) {
    return psId;
  }

  const node = new Node(n.TEXT, parent, { value: parser.current.literal });
  if (parser.currentOneOf(t.WHITESPACE, t.EOL)) {
    node.value = ` `;
  }
  node.startToken = parser.consume();
  node.endToken = node.startToken;

  // handle special case where we're starting a line with something like `+++[+++`
  if (parser.peekTokens(t.RAW_PASSTHROUGH, t.TRIPLE_PLUS)) {
    node.value = parser.consume().literal;
    parser.consume();
  }

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
      t.TRIPLE_PLUS,
    ) &&
    !parser.stopTokensFound()
  ) {
    const passthruResult = handlePassthru(node, parser);
    if (passthruResult === `continue`) {
      continue;
    } else if (passthruResult === `return`) {
      return endNode(node, parser);
    }

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
  return endNode(node, parser);
};

export default textParselet;

function handlePassthru(
  node: AstNode,
  parser: Parser,
): `proceed` | 'return' | 'continue' {
  if (!parser.currentIs(t.TRIPLE_PLUS)) {
    return `proceed`;
  }

  // we only consume (certain) INLINE passthroughs
  if (!parser.peekTokens(t.TRIPLE_PLUS, t.RAW_PASSTHROUGH, t.TRIPLE_PLUS)) {
    return `return`;
  }

  if (!parser.peek.literal.match(/^(\.|\[|\]|-|;|\*)$/)) {
    return `return`;
  }

  parser.consume(t.TRIPLE_PLUS);
  node.endToken = parser.consume(t.RAW_PASSTHROUGH);
  node.value += node.endToken.literal;
  parser.consume(t.TRIPLE_PLUS);
  return `continue`;
}

function endNode(node: AstNode, parser: Parser): AstNode {
  node.endToken = parser.lastSignificantToken();
  return node;
}

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
