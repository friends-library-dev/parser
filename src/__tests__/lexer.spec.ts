import { test, describe, it, expect } from '@jest/globals';
import Lexer from '../Lexer';

describe(`lexer`, () => {
  it(`lexes a single word`, () => {
    const lexer = new Lexer({ adoc: `foo\n` });
    expect(lexer.nextToken()).toMatchObject({ type: `TEXT`, literal: `foo` });
    expect(lexer.nextToken()).toMatchObject({ type: `EOL`, literal: `\n` });
    expect(lexer.nextToken()).toMatchObject({ type: `EOF`, literal: `` });
  });

  it(`attaches file, line number, and cols`, () => {
    const lexer = new Lexer({ adoc: `foo\n`, filename: `bar.adoc` });
    expect(lexer.nextToken()).toMatchObject({
      type: `TEXT`,
      literal: `foo`,
      filename: `bar.adoc`,
      line: 1,
      column: { start: 1, end: 3 },
    });
  });

  test(`EOF has correct file/line/col info`, () => {
    const lexer = new Lexer({ adoc: `foo\n`, filename: `bar.adoc` });
    lexer.nextToken(); // `foo`
    lexer.nextToken(); // `\n`
    expect(lexer.nextToken()).toMatchObject({
      type: `EOF`,
      literal: ``,
      filename: `bar.adoc`,
      line: 1,
      column: { start: 4, end: 4 },
    });
  });

  it(`lexes italicized word`, () => {
    const lexer = new Lexer({ adoc: `_foo_`, filename: 'test.adoc' });
    expect(lexer.nextToken()).toMatchObject({ type: `SINGLE_UNDERSCORE`, literal: `_` });
    expect(lexer.nextToken()).toMatchObject({ type: `TEXT`, literal: `foo` });
    expect(lexer.nextToken()).toMatchObject({ type: `SINGLE_UNDERSCORE`, literal: `_` });
  });

  test(`spaces are matched`, () => {
    const lexer = new Lexer({ adoc: `foo bar   baz\n`, filename: `test.adoc` });
    const [, single, , triple] = lexer.tokens();
    expect(single).toMatchObject({ type: `WHITESPACE`, literal: ` ` });
    expect(triple).toMatchObject({ type: `WHITESPACE`, literal: `   ` });
  });
});
