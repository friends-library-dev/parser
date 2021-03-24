import Node from '../nodes/AstNode';
import FootnotePoetryParser from '../parsers/FootnotePoetryParser';
import { Parselet, TOKEN as t, NODE as n, TokenSpec } from '../types';

const footnoteParselet: Parselet = (parser, parent) => {
  const footnote = new Node(n.FOOTNOTE, parent, { startToken: parser.current });

  if (parser.currentIs(t.CARET)) {
    parser.consumeMany(t.CARET, t.EOL);
  }

  parser.consumeMany(t.FOOTNOTE_PREFIX, t.LEFT_BRACKET);

  if (parser.currentIs(t.RIGHT_BRACKET)) {
    parser.throwError(`unexpected empty footnote`);
  }

  const bufp = parser.getBufferedParser((p) => {
    if (p.currentIs(t.DOUBLE_EOL)) {
      return true;
    }

    if (!p.currentIs(t.RIGHT_BRACKET)) {
      return false;
    }

    // escaped bracket +++]+++ is not a footnote end
    if (p.peekIs(t.TRIPLE_PLUS)) {
      return false;
    }

    // [.book-title]#Apology# within footnote is not end
    if ([`book-title`, `underline`].includes(p.lookBehind(-1)?.literal || ``)) {
      return false;
    }

    return true;
  }, 1);

  const poetryStart: TokenSpec[] = [t.EOL, t.BACKTICK, [t.WHITESPACE, `    `]];
  const stops: TokenSpec[][] = [
    [t.FOOTNOTE_PARAGRAPH_SPLIT],
    [t.EOL, t.EOF],
    [t.EOF, t.EOD],
    poetryStart,
  ];

  const guard = bufp.makeWhileGuard(`footnoteParselet()`);
  while (guard() && !bufp.peekTokensAnyOf(...stops)) {
    const para = new Node(n.PARAGRAPH, footnote, { startToken: bufp.current });
    para.children = bufp.parseUntilAnyOf(para, ...stops);
    para.endToken = bufp.lastSignificantToken();
    footnote.children.push(para);
    bufp.consumeIf(t.FOOTNOTE_PARAGRAPH_SPLIT);
    if (bufp.peekTokens(...poetryStart)) {
      bufp.consume(t.EOL);
      const fnPoetryParser = new FootnotePoetryParser(bufp);
      footnote.children.push(fnPoetryParser.parse(footnote));
      bufp.consumeIf(t.FOOTNOTE_PARAGRAPH_SPLIT);
    }
    bufp.consumeIf(t.EOL);
  }

  footnote.endToken = parser.expectLookBehind(-1); // right bracket `]`
  if (!parser.tokenIs(footnote.endToken, t.RIGHT_BRACKET)) {
    parser.throwError(`unexpected footnote ending token`);
  }

  footnote.document().footnotes.children.push(footnote);
  return footnote;
};

export default footnoteParselet;
