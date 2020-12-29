import { test, describe, it, expect } from '@jest/globals';
import Lexer from '../Lexer';

describe(`lexer`, () => {
  it(`lexes a single word`, () => {
    const lexer = new Lexer(`foo\n`);
    expect(lexer.nextToken()).toMatchObject({ type: `TEXT`, literal: `foo` });
    expect(lexer.nextToken()).toMatchObject({ type: `EOL`, literal: `\n` });
    expect(lexer.nextToken()).toMatchObject({ type: `EOF`, literal: `` });
  });

  it.only(`attaches file, line number, and cols`, () => {
    const lexer = new Lexer(`foo\n`, `bar.adoc`);
    expect(lexer.nextToken()).toMatchObject({
      type: `TEXT`,
      literal: `foo`,
      filename: `bar.adoc`,
      lineNumber: 1,
      columnStart: 1,
      columnEnd: 3,
    });
  });

  it(`lexes italicized word`, () => {
    const lexer = new Lexer(`_foo_`);
    expect(lexer.nextToken()).toMatchObject({ type: `SINGLE_UNDERSCORE`, literal: `_` });
    expect(lexer.nextToken()).toMatchObject({ type: `TEXT`, literal: `foo` });
    expect(lexer.nextToken()).toMatchObject({ type: `SINGLE_UNDERSCORE`, literal: `_` });
  });
});
