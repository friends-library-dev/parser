import Node from '../nodes/AstNode';
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

  const bufp = parser.getBufferedParser((p) => p.peekTokens(t.RIGHT_BRACKET, t.EOX), 1);

  const stops: TokenSpec[][] = [[t.FOOTNOTE_PARAGRAPH_SPLIT], [t.EOL, t.EOF]];
  const guard = bufp.makeWhileGuard(`footnoteParselet()`);
  while (guard() && !bufp.peekTokensAnyOf(...stops)) {
    const para = new Node(n.PARAGRAPH, footnote, { startToken: bufp.current });
    para.children = bufp.parseUntilAnyOf(para, ...stops);
    para.endToken = bufp.lastSignificantToken();
    footnote.children.push(para);
    if (bufp.currentIs(t.FOOTNOTE_PARAGRAPH_SPLIT)) {
      bufp.consumeMany(t.FOOTNOTE_PARAGRAPH_SPLIT, t.EOL);
    }
  }

  footnote.endToken = parser.expectLookBehind(-1); // right bracket `]`
  return footnote;
};

export default footnoteParselet;
