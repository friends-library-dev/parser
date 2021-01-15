import Node from '../nodes/AstNode';
import Parser from '../Parser';
import { Parselet, TOKEN as t, NODE as n, TokenSpec } from '../types';

const footnoteParselet: Parselet = (parser, parent) => {
  const footnote = new Node(n.FOOTNOTE, parent, { startToken: parser.current });
  if (parser.currentIs(t.CARET)) {
    parser.consumeMany(t.CARET, t.EOL);
  }
  parser.consumeMany(t.FOOTNOTE_PREFIX, t.LEFT_BRACKET);

  if (parser.currentIs(t.RIGHT_BRACKET)) {
    parser.error(`unexpected empty footnote`);
  }

  parser = parser.getBufferedParser((p) => p.peekTokens(t.RIGHT_BRACKET, t.EOX), 1);

  const stops: TokenSpec[][] = [[t.FOOTNOTE_PARAGRAPH_SPLIT], [t.EOL, t.EOF]];
  const guard = parser.makeWhileGuard(`footnoteParselet()`);
  while (guard() && !parser.peekTokensAnyOf(...stops)) {
    const para = new Node(n.PARAGRAPH, footnote, { startToken: parser.current });
    para.children = parser.parseUntilAnyOf(para, ...stops);
    footnote.children.push(para);
    if (parser.currentIs(t.FOOTNOTE_PARAGRAPH_SPLIT)) {
      parser.consumeMany(t.FOOTNOTE_PARAGRAPH_SPLIT, t.EOL);
    }
  }

  return footnote;
};

export default footnoteParselet;

// 1. multi para
// 2. caret
// 3. run on AB
// 4. commit?
