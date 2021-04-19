import { test, describe, it, expect } from '@jest/globals';
import { TOKEN as t, Token } from '../types';
import Lexer from '../Lexer';
import { simplifyToken } from './helpers';

describe(`lexer`, () => {
  it(`attaches file, line number, and cols`, () => {
    const lexer = new Lexer({ adoc: `foo\n`, filename: `bar.adoc` });
    expect(lexer.nextToken()).toMatchObject({
      type: t.TEXT,
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
      type: t.EOF,
      literal: ``,
      filename: `bar.adoc`,
      line: 1,
      column: { start: 4, end: 4 },
    });
  });

  test(`single file ends with EOF then EOD`, () => {
    expect(simpleTokens(`foo\n`, WITH_TRAILING_TOKENS)).toMatchObject([
      { type: t.TEXT, literal: `foo` },
      { type: t.EOL, literal: `\n` },
      { type: t.EOF, literal: `` },
      { type: t.EOD, literal: `` },
    ]);
  });

  test(`multiple files has one multiple EOF and one EOD`, () => {
    const lexer = new Lexer({ adoc: `foo\n` }, { adoc: `bar\n` });
    const tokens = lexer.tokens().map(simplifyToken);
    expect(tokens).toMatchObject([
      { type: t.TEXT, literal: `foo` },
      { type: t.EOL, literal: `\n` },
      { type: t.EOF, literal: `` },
      { type: t.TEXT, literal: `bar` },
      { type: t.EOL, literal: `\n` },
      { type: t.EOF, literal: `` },
      { type: t.EOD, literal: `` },
    ]);
  });

  it(`lexes italicized word`, () => {
    const lexer = new Lexer({ adoc: `_foo_`, filename: `test.adoc` });
    expect(lexer.nextToken()).toMatchObject({ type: t.UNDERSCORE, literal: `_` });
    expect(lexer.nextToken()).toMatchObject({ type: t.TEXT, literal: `foo` });
    expect(lexer.nextToken()).toMatchObject({ type: t.UNDERSCORE, literal: `_` });
  });

  test(`spaces are matched`, () => {
    const lexer = new Lexer({ adoc: `foo bar   baz\n`, filename: `test.adoc` });
    const [, single, , triple] = lexer.tokens();
    expect(single).toMatchObject({ type: t.WHITESPACE, literal: ` ` });
    expect(triple).toMatchObject({ type: t.WHITESPACE, literal: `   ` });
  });

  test(`curly quotes`, () => {
    const [leftDbl, , rightDbl] = tokens(`"\`foo\`"`);
    expect(leftDbl).toMatchObject({ type: t.LEFT_DOUBLE_CURLY, literal: `"\`` });
    expect(rightDbl).toMatchObject({ type: t.RIGHT_DOUBLE_CURLY, literal: `\`"` });
  });

  test(`it can lex a straight single quote`, () => {
    expect(simpleTokens(`Man's`)).toMatchObject([
      { type: t.TEXT, literal: `Man` },
      { type: t.STRAIGHT_SINGLE_QUOTE, literal: `'` },
      { type: t.TEXT, literal: `s` },
    ]);
  });

  test(`two newlines should become DOUBLE_EOL`, () => {
    expect(simpleTokens(`foo\n\nfoo`)).toMatchObject([
      { type: t.TEXT, literal: `foo` },
      { type: t.DOUBLE_EOL, literal: `\n\n` },
      { type: t.TEXT, literal: `foo` },
    ]);
  });

  test(`class designation`, () => {
    expect(simpleTokens(`[.foo-bar]`)).toMatchObject([
      { type: t.LEFT_BRACKET, literal: `[` },
      { type: t.DOT, literal: `.` },
      { type: t.TEXT, literal: `foo-bar` },
      { type: t.RIGHT_BRACKET, literal: `]` },
    ]);
  });

  test(`complex bracket sequence`, () => {
    expect(simpleTokens(`[quote.epigraph, , Ps. 37:18]\n`)).toMatchObject([
      { type: t.LEFT_BRACKET, literal: `[` },
      { type: t.TEXT, literal: `quote` },
      { type: t.DOT, literal: `.` },
      { type: t.TEXT, literal: `epigraph` },
      { type: t.COMMA, literal: `,` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.COMMA, literal: `,` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `Ps` },
      { type: t.DOT, literal: `.` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `37` },
      { type: t.COLON, literal: `:` },
      { type: t.TEXT, literal: `18` },
      { type: t.RIGHT_BRACKET, literal: `]` },
    ]);
  });

  test(`quote block`, () => {
    expect(simpleTokens(`[quote]\n____\nfoo\n____`)).toMatchObject([
      { type: t.LEFT_BRACKET, literal: `[` },
      { type: t.TEXT, literal: `quote` },
      { type: t.RIGHT_BRACKET, literal: `]` },
      { type: t.EOL, literal: `\n` },
      { type: t.UNDERSCORE, literal: `____` },
      { type: t.EOL, literal: `\n` },
      { type: t.TEXT, literal: `foo` },
      { type: t.EOL, literal: `\n` },
      { type: t.UNDERSCORE, literal: `____` },
    ]);
  });

  test(`double underscores`, () => {
    expect(simpleTokens(`__foo__ ___`)).toMatchObject([
      { type: t.UNDERSCORE, literal: `__` },
      { type: t.TEXT, literal: `foo` },
      { type: t.UNDERSCORE, literal: `__` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.UNDERSCORE, literal: `___` },
    ]);
  });

  test(`heading`, () => {
    expect(simpleTokens(`== foo`)).toMatchObject([
      { type: t.EQUALS, literal: `==` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `foo` },
    ]);
  });

  test(`triple-plus`, () => {
    expect(simpleTokens(`+++[+++`)).toMatchObject([
      { type: t.TRIPLE_PLUS, literal: `+++` },
      { type: t.RAW_PASSTHROUGH, literal: `[` },
      { type: t.TRIPLE_PLUS, literal: `+++` },
    ]);
  });

  test(`multi-char inline passthrough`, () => {
    expect(simpleTokens(`+++3 + 5 = 7+++`)).toMatchObject([
      { type: t.TRIPLE_PLUS, literal: `+++` },
      { type: t.RAW_PASSTHROUGH, literal: `3 + 5 = 7` },
      { type: t.TRIPLE_PLUS, literal: `+++` },
    ]);
  });

  test(`quadruple-plus`, () => {
    expect(simpleTokens(`++++\n<br />\n++++\n\nfoo`)).toMatchObject([
      { type: t.QUADRUPLE_PLUS, literal: `++++` },
      { type: t.EOL, literal: `\n` },
      { type: t.RAW_PASSTHROUGH, literal: `<br />\n` },
      { type: t.QUADRUPLE_PLUS, literal: `++++` },
      { type: t.DOUBLE_EOL, literal: `\n\n` },
      { type: t.TEXT, literal: `foo` },
    ]);
  });

  test(`multi-line passthrough block`, () => {
    expect(simpleTokens(`++++\n<br />\n<br />\n++++\n\nfoo`)).toMatchObject([
      { type: t.QUADRUPLE_PLUS, literal: `++++` },
      { type: t.EOL, literal: `\n` },
      { type: t.RAW_PASSTHROUGH, literal: `<br />\n` },
      { type: t.RAW_PASSTHROUGH, literal: `<br />\n` },
      { type: t.QUADRUPLE_PLUS, literal: `++++` },
      { type: t.DOUBLE_EOL, literal: `\n\n` },
      { type: t.TEXT, literal: `foo` },
    ]);
  });

  test(`trailing embedded double-dash`, () => {
    const [foo, dblDash] = tokens(`foo--`);
    expect(foo).toMatchObject({
      type: t.TEXT,
      literal: `foo`,
      line: 1,
      column: { start: 1, end: 3 },
    });
    expect(dblDash).toMatchObject({
      type: t.DOUBLE_DASH,
      literal: `--`,
      line: 1,
      column: { start: 4, end: 5 },
    });
  });

  test(`embedded double-dash`, () => {
    expect(simpleTokens(`foo--foo`)).toMatchObject([
      { type: t.TEXT, literal: `foo` },
      { type: t.DOUBLE_DASH, literal: `--` },
      { type: t.TEXT, literal: `foo` },
    ]);
  });

  test(`own-line double-dash`, () => {
    expect(simpleTokens(`--\n\nfoo`)).toMatchObject([
      { type: t.DOUBLE_DASH, literal: `--` },
      { type: t.DOUBLE_EOL, literal: `\n\n` },
      { type: t.TEXT, literal: `foo` },
    ]);
  });

  test(`asterisk`, () => {
    expect(simpleTokens(`* foo\n***\n`)).toMatchObject([
      { type: t.ASTERISK, literal: `*` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `foo` },
      { type: t.EOL, literal: `\n` },
      { type: t.TRIPLE_ASTERISK, literal: `***` },
    ]);
  });

  test(`caret`, () => {
    expect(simpleTokens(`foo^`)).toMatchObject([
      { type: t.TEXT, literal: `foo` },
      { type: t.CARET, literal: `^` },
    ]);
  });

  test(`comment lines are skipped like they didn't exist`, () => {
    expect(simpleTokens(`foo\n// lint-disable\nbar`)).toMatchObject([
      { type: t.TEXT, literal: `foo` },
      { type: t.EOL, literal: `\n` },
      { type: t.TEXT, literal: `bar` },
    ]);
  });

  test(`non-separate footnote prefix`, () => {
    expect(simpleTokens(`hello worldfootnote:[foo]`)).toMatchObject([
      { type: t.TEXT, literal: `hello` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `world` },
      { type: t.FOOTNOTE_PREFIX, literal: `footnote:` },
      { type: t.LEFT_BRACKET, literal: `[` },
      { type: t.TEXT, literal: `foo` },
      { type: t.RIGHT_BRACKET, literal: `]` },
    ]);
  });

  test(`footnote prefix`, () => {
    expect(simpleTokens(`footnote:[foo]`)).toMatchObject([
      { type: t.FOOTNOTE_PREFIX, literal: `footnote:` },
      { type: t.LEFT_BRACKET, literal: `[` },
      { type: t.TEXT, literal: `foo` },
      { type: t.RIGHT_BRACKET, literal: `]` },
    ]);
  });

  test(`single-curleys and asterisms`, () => {
    expect(simpleTokens(`'\`foo\`'\n'''`)).toMatchObject([
      { type: t.LEFT_SINGLE_CURLY, literal: `'\`` },
      { type: t.TEXT, literal: `foo` },
      { type: t.RIGHT_SINGLE_CURLY, literal: `\`'` },
      { type: t.EOL, literal: `\n` },
      { type: t.THEMATIC_BREAK, literal: `'''` },
    ]);
  });

  test(`forward slash`, () => {
    expect(simpleTokens(`foo / foo`)).toMatchObject([
      { type: t.TEXT, literal: `foo` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.FORWARD_SLASH, literal: `/` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `foo` },
    ]);
  });

  test(`escaped numbers`, () => {
    expect(simpleTokens(`1+++.+++ foo`)).toMatchObject([
      { type: t.TEXT, literal: `1` },
      { type: t.TRIPLE_PLUS, literal: `+++` },
      { type: t.RAW_PASSTHROUGH, literal: `.` },
      { type: t.TRIPLE_PLUS, literal: `+++` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `foo` },
    ]);
  });

  test(`double colon`, () => {
    expect(simpleTokens(`foo foo::`)).toMatchObject([
      { type: t.TEXT, literal: `foo` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `foo` },
      { type: t.DOUBLE_COLON, literal: `::` },
    ]);
  });

  test(`backtick`, () => {
    expect(simpleTokens(`\``)).toMatchObject([{ type: t.BACKTICK, literal: `\`` }]);
  });

  test(`footnote poetry stanza marker`, () => {
    expect(simpleTokens(`     foo\n     - - - - - -`)).toMatchObject([
      { type: t.WHITESPACE, literal: `     ` },
      { type: t.TEXT, literal: `foo` },
      { type: t.EOL, literal: `\n` },
      { type: t.WHITESPACE, literal: `     ` },
      { type: t.FOOTNOTE_STANZA, literal: `- - - - - -` },
    ]);
  });

  test(`footnote paragraph split`, () => {
    expect(simpleTokens(`foo\n{footnote-paragraph-split}\nfoo`)).toMatchObject([
      { type: t.TEXT, literal: `foo` },
      { type: t.EOL, literal: `\n` },
      { type: t.FOOTNOTE_PARAGRAPH_SPLIT, literal: `{footnote-paragraph-split}` },
      { type: t.EOL, literal: `\n` },
      { type: t.TEXT, literal: `foo` },
    ]);
  });

  test(`double-dash in class will get reassembled by parser`, () => {
    expect(simpleTokens(`[.chapter-subtitle--blurb]`)).toMatchObject([
      { type: t.LEFT_BRACKET, literal: `[` },
      { type: t.DOT, literal: `.` },
      { type: t.TEXT, literal: `chapter-subtitle` },
      { type: t.DOUBLE_DASH, literal: `--` },
      { type: t.TEXT, literal: `blurb` },
      { type: t.RIGHT_BRACKET, literal: `]` },
    ]);
  });

  test(`other punctuation`, () => {
    expect(simpleTokens(`foo? foo; foo!`)).toMatchObject([
      { type: t.TEXT, literal: `foo` },
      { type: t.QUESTION_MARK, literal: `?` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `foo` },
      { type: t.SEMICOLON, literal: `;` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `foo` },
      { type: t.EXCLAMATION_MARK, literal: `!` },
    ]);
  });

  test(`class attributes`, () => {
    expect(simpleTokens(`[cols="3,4"]`)).toMatchObject([
      { type: t.LEFT_BRACKET, literal: `[` },
      { type: t.TEXT, literal: `cols` },
      { type: t.EQUALS, literal: `=` },
      { type: t.STRAIGHT_DOUBLE_QUOTE, literal: `"` },
      { type: t.TEXT, literal: `3` },
      { type: t.COMMA, literal: `,` },
      { type: t.TEXT, literal: `4` },
      { type: t.STRAIGHT_DOUBLE_QUOTE, literal: `"` },
      { type: t.RIGHT_BRACKET, literal: `]` },
    ]);
  });

  test(`table bars`, () => {
    expect(simpleTokens(`|===\n|The\n|\n_Eleventh_ +`)).toMatchObject([
      { type: t.PIPE, literal: `|` },
      { type: t.EQUALS, literal: `===` },
      { type: t.EOL, literal: `\n` },
      { type: t.PIPE, literal: `|` },
      { type: t.TEXT, literal: `The` },
      { type: t.EOL, literal: `\n` },
      { type: t.PIPE, literal: `|` },
      { type: t.EOL, literal: `\n` },
      { type: t.UNDERSCORE, literal: `_` },
      { type: t.TEXT, literal: `Eleventh` },
      { type: t.UNDERSCORE, literal: `_` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.PLUS, literal: `+` },
    ]);
  });

  test(`double asterisk (bold)`, () => {
    expect(simpleTokens(`**foo**`)).toMatchObject([
      { type: t.DOUBLE_ASTERISK, literal: `**` },
      { type: t.TEXT, literal: `foo` },
      { type: t.DOUBLE_ASTERISK, literal: `**` },
    ]);
  });

  test(`currency`, () => {
    expect(simpleTokens(`£$`)).toMatchObject([
      { type: t.POUND_SYMBOL, literal: `£` },
      { type: t.DOLLAR_SYMBOL, literal: `$` },
    ]);
  });

  test(`parens`, () => {
    expect(simpleTokens(`(foo)`)).toMatchObject([
      { type: t.LEFT_PARENS, literal: `(` },
      { type: t.TEXT, literal: `foo` },
      { type: t.RIGHT_PARENS, literal: `)` },
    ]);
  });

  test(`book title`, () => {
    expect(simpleTokens(`[.book-title]#Apology#`)).toMatchObject([
      { type: t.LEFT_BRACKET, literal: `[` },
      { type: t.DOT, literal: `.` },
      { type: t.TEXT, literal: `book-title` },
      { type: t.RIGHT_BRACKET, literal: `]` },
      { type: t.HASH, literal: `#` },
      { type: t.TEXT, literal: `Apology` },
      { type: t.HASH, literal: `#` },
    ]);
  });

  test(`degree symbol`, () => {
    expect(simpleTokens(`39°`)).toMatchObject([
      { type: t.TEXT, literal: `39` },
      { type: t.DEGREE_SYMBOL, literal: `°` },
    ]);
  });

  test(`entities`, () => {
    expect(simpleTokens(`foo&hellip; &hellip;&#8212; &mdash; &amp; & foo`)).toMatchObject(
      [
        { type: t.TEXT, literal: `foo` },
        { type: t.ENTITY, literal: `&hellip;` },
        { type: t.WHITESPACE, literal: ` ` },
        { type: t.ENTITY, literal: `&hellip;` },
        { type: t.ENTITY, literal: `&#8212;` },
        { type: t.WHITESPACE, literal: ` ` },
        { type: t.ENTITY, literal: `&mdash;` },
        { type: t.WHITESPACE, literal: ` ` },
        { type: t.ENTITY, literal: `&amp;` },
        { type: t.WHITESPACE, literal: ` ` },
        { type: t.ENTITY, literal: `&` },
        { type: t.WHITESPACE, literal: ` ` },
        { type: t.TEXT, literal: `foo` },
      ],
    );
  });

  test(`non-standard chars`, () => {
    expect(simpleTokens(`íéóáúñüÍÉÓÁÚÑÜ¡¿`)).toMatchObject([
      { type: t.TEXT, literal: `íéóáúñüÍÉÓÁÚÑÜ¡¿` },
    ]);
  });

  test(`colon at end of sentence`, () => {
    expect(simpleTokens(`foo viz.:\nfoo`)).toMatchObject([
      { type: t.TEXT, literal: `foo` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `viz` },
      { type: t.DOT, literal: `.` },
      { type: t.COLON, literal: `:` },
      { type: t.EOL, literal: `\n` },
      { type: t.TEXT, literal: `foo` },
    ]);
  });

  test(`group of underscores (redacted name)`, () => {
    expect(simpleTokens(`Dear +++______+++ followed`)).toMatchObject([
      { type: t.TEXT, literal: `Dear` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TRIPLE_PLUS, literal: `+++` },
      { type: t.RAW_PASSTHROUGH, literal: `______` },
      { type: t.TRIPLE_PLUS, literal: `+++` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `followed` },
    ]);
  });
});

function tokens(adoc: string): Token[] {
  return new Lexer({ adoc }).tokens();
}

function simpleTokens(adoc: string, all = false): Pick<Token, 'type' | 'literal'>[] {
  const toks = tokens(adoc).map(simplifyToken);

  if (all) {
    return toks;
  }

  // remove EOD and EOF
  toks.pop();
  toks.pop();

  // remove trailing EOL, if present
  const last = toks.pop();
  if (last && last.type !== t.EOL) {
    toks.push(last);
  }

  return toks;
}

const WITH_TRAILING_TOKENS = true;
