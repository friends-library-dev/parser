import { test, describe, it, expect } from '@jest/globals';
import Lexer, { TOKEN as T, Token } from '../Lexer';

describe(`lexer`, () => {
  it(`lexes a single word`, () => {
    const lexer = new Lexer({ adoc: `foo\n` });
    expect(lexer.nextToken()).toMatchObject({ type: T.TEXT, literal: `foo` });
    expect(lexer.nextToken()).toMatchObject({ type: T.EOL, literal: `\n` });
    expect(lexer.nextToken()).toMatchObject({ type: T.EOF, literal: `` });
  });

  it(`attaches file, line number, and cols`, () => {
    const lexer = new Lexer({ adoc: `foo\n`, filename: `bar.adoc` });
    expect(lexer.nextToken()).toMatchObject({
      type: T.TEXT,
      literal: `foo`,
      filename: `bar.adoc`,
      line: 1,
      column: { start: 1, end: 3 },
    });
  });

  test(`EOF has correct file/line/col info`, () => {
    const lexer = new Lexer({ adoc: `foo\n`, filename: `bar.adoc` });
    const [, , eof] = lexer.tokens();
    expect(eof).toMatchObject({
      type: T.EOF,
      literal: ``,
      filename: `bar.adoc`,
      line: 1,
      column: { start: 4, end: 4 },
    });
  });

  it(`lexes italicized word`, () => {
    const lexer = new Lexer({ adoc: `_foo_`, filename: 'test.adoc' });
    expect(lexer.nextToken()).toMatchObject({ type: T.SINGLE_UNDERSCORE, literal: `_` });
    expect(lexer.nextToken()).toMatchObject({ type: T.TEXT, literal: `foo` });
    expect(lexer.nextToken()).toMatchObject({ type: T.SINGLE_UNDERSCORE, literal: `_` });
  });

  test(`spaces are matched`, () => {
    const lexer = new Lexer({ adoc: `foo bar   baz\n`, filename: `test.adoc` });
    const [, single, , triple] = lexer.tokens();
    expect(single).toMatchObject({ type: T.WHITESPACE, literal: ` ` });
    expect(triple).toMatchObject({ type: T.WHITESPACE, literal: `   ` });
  });

  test(`curly quotes`, () => {
    const [leftDbl, , rightDbl] = tokens(`"\`foo\`"`);
    expect(leftDbl).toMatchObject({ type: T.LEFT_DOUBLE_CURLY, literal: `"\`` });
    expect(rightDbl).toMatchObject({ type: T.RIGHT_DOUBLE_CURLY, literal: `\`"` });
  });

  test('class designation', () => {
    expect(simpleTokens(`[.foo-bar]`)).toMatchObject([
      { type: T.LEFT_BRACE, literal: `[` },
      { type: T.DOT, literal: `.` },
      { type: T.TEXT, literal: `foo-bar` },
      { type: T.RIGHT_BRACE, literal: `]` },
    ]);
  });

  test('complex bracket sequence', () => {
    expect(simpleTokens(`[quote.epigraph, , Ps. 37:18]\n`)).toMatchObject([
      { type: T.LEFT_BRACE, literal: `[` },
      { type: T.TEXT, literal: `quote` },
      { type: T.DOT, literal: `.` },
      { type: T.TEXT, literal: `epigraph` },
      { type: T.COMMA, literal: `,` },
      { type: T.WHITESPACE, literal: ` ` },
      { type: T.COMMA, literal: `,` },
      { type: T.WHITESPACE, literal: ` ` },
      { type: T.TEXT, literal: `Ps` },
      { type: T.DOT, literal: `.` },
      { type: T.WHITESPACE, literal: ` ` },
      { type: T.TEXT, literal: `37:18` },
      { type: T.RIGHT_BRACE, literal: `]` },
    ]);
  });

  test('quote block', () => {
    expect(simpleTokens(`[quote]\n____\nfoo\n____`)).toMatchObject([
      { type: T.LEFT_BRACE, literal: `[` },
      { type: T.TEXT, literal: `quote` },
      { type: T.RIGHT_BRACE, literal: `]` },
      { type: T.EOL, literal: `\n` },
      { type: T.QUOTE_BLOCK_DELIMITER, literal: `____` },
      { type: T.EOL, literal: `\n` },
      { type: T.TEXT, literal: `foo` },
      { type: T.EOL, literal: `\n` },
      { type: T.QUOTE_BLOCK_DELIMITER, literal: `____` },
    ]);
  });

  test('double underscores', () => {
    expect(simpleTokens(`__foo__ ___`)).toMatchObject([
      { type: T.DOUBLE_UNDERSCORE, literal: `__` },
      { type: T.TEXT, literal: `foo` },
      { type: T.DOUBLE_UNDERSCORE, literal: `__` },
      { type: T.WHITESPACE, literal: ` ` },
      { type: T.ILLEGAL, literal: `___` },
    ]);
  });

  test('heading', () => {
    expect(simpleTokens(`== foo`)).toMatchObject([
      { type: T.EQUALS, literal: `==` },
      SPACE_TOKEN,
      FOO_TOKEN,
    ]);
  });

  test('triple-plus', () => {
    expect(simpleTokens(`+++[+++`)).toMatchObject([
      { type: T.TRIPLE_PLUS, literal: `+++` },
      { type: T.LEFT_BRACE, literal: `[` },
      { type: T.TRIPLE_PLUS, literal: `+++` },
    ]);
  });

  test(`trailing embedded double-dash`, () => {
    const [foo, dblDash] = tokens(`foo--`);
    expect(foo).toMatchObject({
      type: T.TEXT,
      literal: `foo`,
      line: 1,
      column: { start: 1, end: 3 },
    });
    expect(dblDash).toMatchObject({
      type: T.DOUBLE_DASH,
      literal: `--`,
      line: 1,
      column: { start: 4, end: 5 },
    });
  });

  test('embedded double-dash', () => {
    expect(simpleTokens(`foo--foo`)).toMatchObject([
      FOO_TOKEN,
      { type: T.DOUBLE_DASH, literal: `--` },
      FOO_TOKEN,
    ]);
  });

  test('own-line double-dash', () => {
    expect(simpleTokens(`--\n\n`)).toMatchObject([
      { type: T.DOUBLE_DASH, literal: `--` },
      EOL_TOKEN,
    ]);
  });

  test('asterisk', () => {
    expect(simpleTokens(`* foo\n***\n`)).toMatchObject([
      { type: T.ASTERISK, literal: `*` },
      SPACE_TOKEN,
      FOO_TOKEN,
      EOL_TOKEN,
      { type: T.TRIPLE_ASTERISK, literal: `***` },
    ]);
  });

  test('caret', () => {
    expect(simpleTokens(`foo^`)).toMatchObject([
      FOO_TOKEN,
      { type: T.CARET, literal: `^` },
    ]);
  });

  test('footnote prefix', () => {
    expect(simpleTokens(`footnote:[foo]`)).toMatchObject([
      { type: T.FOOTNOTE_PREFIX, literal: `footnote:` },
      { type: T.LEFT_BRACE, literal: `[` },
      FOO_TOKEN,
      { type: T.RIGHT_BRACE, literal: `]` },
    ]);
  });

  test('single-curleys and asterisms', () => {
    expect(simpleTokens(`'\`foo\`'\n'''`)).toMatchObject([
      { type: T.LEFT_SINGLE_CURLY, literal: `'\`` },
      FOO_TOKEN,
      { type: T.RIGHT_SINGLE_CURLY, literal: `\`'` },
      EOL_TOKEN,
      { type: T.ASTERISM, literal: `'''` },
    ]);
  });

  test('forward slash', () => {
    expect(simpleTokens(`foo / foo`)).toMatchObject([
      FOO_TOKEN,
      SPACE_TOKEN,
      { type: T.FORWARD_SLASH, literal: `/` },
      SPACE_TOKEN,
      FOO_TOKEN,
    ]);
  });

  test('escaped numbers', () => {
    expect(simpleTokens(`1+++.+++ foo`)).toMatchObject([
      { type: T.TEXT, literal: `1` },
      { type: T.TRIPLE_PLUS, literal: `+++` },
      { type: T.DOT, literal: `.` },
      { type: T.TRIPLE_PLUS, literal: `+++` },
      SPACE_TOKEN,
      FOO_TOKEN,
    ]);
  });

  test('double colon', () => {
    expect(simpleTokens(`foo foo::`)).toMatchObject([
      FOO_TOKEN,
      SPACE_TOKEN,
      FOO_TOKEN,
      { type: T.DOUBLE_COLON, literal: `::` },
    ]);
  });

  test('backtick', () => {
    expect(simpleTokens(`\``)).toMatchObject([{ type: T.BACKTICK, literal: `\`` }]);
  });

  test('footnote poetry stanza marker', () => {
    expect(simpleTokens(`     foo\n     - - - - - -`)).toMatchObject([
      { type: T.WHITESPACE, literal: `     ` },
      FOO_TOKEN,
      EOL_TOKEN,
      { type: T.WHITESPACE, literal: `     ` },
      { type: T.FOOTNOTE_STANZA, literal: `- - - - - -` },
    ]);
  });

  test('footnote paragraph split', () => {
    expect(simpleTokens(`foo\n{footnote-paragraph-split}\nfoo`)).toMatchObject([
      FOO_TOKEN,
      EOL_TOKEN,
      { type: T.FOOTNOTE_PARAGRAPH_SPLIT, literal: `{footnote-paragraph-split}` },
      EOL_TOKEN,
      FOO_TOKEN,
    ]);
  });
});

// [.chapter-subtitle--blurb]
// Foo!  foo? foo;
// spanish special chars

function tokens(adoc: string): Token[] {
  return new Lexer({ adoc }).tokens();
}

function simpleTokens(adoc: string): Pick<Token, 'type' | 'literal'>[] {
  const toks = tokens(adoc).map((tok) => ({ type: tok.type, literal: tok.literal }));

  // remove EOF
  toks.pop();

  // remove trailing EOL, if present
  const last = toks.pop();
  if (last && last.type !== T.EOL) {
    toks.push(last);
  }

  return toks;
}

const FOO_TOKEN = { type: T.TEXT, literal: `foo` };
const EOL_TOKEN = { type: T.EOL, literal: `\n` };
const SPACE_TOKEN = { type: T.WHITESPACE, literal: ` ` };
