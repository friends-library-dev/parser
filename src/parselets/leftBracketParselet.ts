import { Parselet, TOKEN as t, NODE as n } from '../types';
import Parser from '../Parser';
import textParselet from './textParselet';
import Node from '../nodes/AstNode';
import Context from '../Context';

const leftBracket: Parselet = (parser, parent) => {
  if (isInlineStart(parser)) {
    const leftBracket = parser.consume(t.LEFT_BRACKET);
    parser.consume(t.DOT);
    const context = new Context();
    context.startToken = leftBracket;
    context.classList.push(parser.consume(t.TEXT).literal);
    context.endToken = parser.consume(t.RIGHT_BRACKET);
    parser.consume(t.HASH);
    const inline = new Node(n.INLINE, parent, { context });
    inline.children = parser.parseUntil(inline, t.HASH);
    inline.endToken = parser.consumeClose(t.HASH, n.INLINE, leftBracket);
    return inline;
  }

  // if it's not a book title or a context line, we can safely treat like plain text
  if (!isContextLine(parser)) {
    const leftBracket = parser.consume(t.LEFT_BRACKET);
    const textNode = textParselet(parser, parent);
    textNode.startToken = leftBracket;
    textNode.value = `[${textNode.value}`;
    return textNode;
  }

  throw parser.throwError(`unexpected left bracket`);
};

export default leftBracket;

function isInlineStart(parser: Parser): boolean {
  return (
    parser.peekTokens(t.LEFT_BRACKET, t.DOT, t.TEXT, t.RIGHT_BRACKET, t.HASH) &&
    [`book-title`, `underline`].includes(parser.lookAhead(2).literal)
  );
}

function isContextLine(parser: Parser): boolean {
  if (parser.current.column.start !== 1) {
    return false;
  }

  let i = 1;
  const guard = parser.makeWhileGuard(`leftBracketParselet/isContextLine()`);
  while (guard() && !parser.tokenIs(parser.lookAhead(i), t.EOX)) {
    i++;
  }

  // it's a context line if the line also ENDs with `]`
  return parser.tokenIs(parser.lookAhead(i - 1), t.RIGHT_PARENS);
}
