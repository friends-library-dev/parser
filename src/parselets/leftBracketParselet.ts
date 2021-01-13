import ChildNode from '../nodes/ChildNode';
import Parser from '../Parser';
import { Parselet, TOKEN as t, NODE as n } from '../types';
import textParselet from './textParselet';

const leftBracket: Parselet = (parser, parent) => {
  if (isConsumableAsText(parser)) {
    parser.consume(t.LEFT_BRACKET);
    const textNode = textParselet(parser, parent);
    textNode.value = `[${textNode.value}`;
    return textNode;
  }
  throw new Error(`non-text-consumable [ no implemented`);
};

export default leftBracket;

function isConsumableAsText(parser: Parser): boolean {
  if (isContextLine(parser)) {
    return false;
  }
  if (isBookTitle(parser)) {
    return false;
  }
  return true;
}

function isBookTitle(parser: Parser): boolean {
  return parser.peekTokens(
    t.LEFT_BRACKET,
    t.DOT,
    [t.TEXT, `book-title`],
    t.RIGHT_BRACKET,
    t.HASH,
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
