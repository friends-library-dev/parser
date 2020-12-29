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
    const [leftBrace, dot, klass, rightBrace] = tokens(`[.foo-bar]`);
    expect(leftBrace).toMatchObject({ type: T.LEFT_BRACE, literal: `[` });
    expect(dot).toMatchObject({ type: T.DOT, literal: `.` });
    expect(klass).toMatchObject({ type: T.TEXT, literal: `foo-bar` });
    expect(rightBrace).toMatchObject({ type: T.RIGHT_BRACE, literal: `]` });
  });

  test('complex bracket sequence', () => {
    expect(tokens(`[quote.epigraph, , Ps. 37:18]\n`)).toMatchObject([
      { type: T.LEFT_BRACE },
      { type: T.TEXT, literal: `quote` },
      { type: T.DOT },
      { type: T.COMMA, literal: `,` },
      { type: T.WHITESPACE, literal: ` ` },
      { type: T.COMMA, literal: `,` },
      { type: T.WHITESPACE, literal: ` ` },
      { type: T.TEXT, literal: `Ps` },
      { type: T.DOT },
      { type: T.WHITESPACE, literal: ` ` },
      { type: T.TEXT, literal: `37:18` },
      { type: T.RIGHT_BRACE },
      { type: T.EOL },
      { type: T.EOF },
    ]);
  });
});

function tokens(adoc: string): Token[] {
  return new Lexer({ adoc }).tokens();
}
