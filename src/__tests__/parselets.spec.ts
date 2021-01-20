import { TOKEN as t, NODE as n } from '../types';
import { getPara, getParser, assertAllNodesHaveTokens } from './helpers';

describe(`Parser.parseUntil() using parselets`, () => {
  it(`can handle text nodes`, () => {
    const parser = getParser(`Hello world\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      type: n.TEXT,
      value: `Hello world`,
    });
  });

  it(`can handle text nodes with ampersands`, () => {
    const parser = getParser(`Hello & world\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      type: n.TEXT,
      value: `Hello & world`,
    });
  });

  it(`can handle redacted words`, () => {
    const parser = getParser(`Hello _______ world\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `Hello ` },
      { type: n.REDACTED, value: `_______` },
      { type: n.TEXT, value: ` world` },
    ]);
  });

  it(`can handle redacted words (escaped)`, () => {
    const parser = getParser(`Hello +++_______+++ world\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `Hello ` },
      { type: n.REDACTED, value: `_______` },
      { type: n.TEXT, value: ` world` },
    ]);
  });

  it(`can handle emdash entity`, () => {
    const parser = getParser(`Epistles 1 &#8212; 31\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `Epistles 1 ` },
      { type: n.ENTITY, value: `&#8212;`, meta: { subType: `EMDASH` } },
      { type: n.TEXT, value: ` 31` },
    ]);
  });

  it(`can handle ellipses entity`, () => {
    const parser = getParser(`Hello world&hellip;\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(2);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `Hello world` },
      { type: n.ENTITY, value: `&hellip;`, meta: { subType: `ELLIPSES` } },
    ]);
  });

  it(`can handle ampersand entity`, () => {
    const parser = getParser(`Hello world&amp;\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(2);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `Hello world` },
      { type: n.ENTITY, value: `&amp;`, meta: { subType: `AMPERSAND` } },
    ]);
  });

  it(`can handle right bracket after symbol`, () => {
    const parser = getParser(`Hello world\`"]\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `Hello world` },
      { type: n.SYMBOL, value: `\`"`, meta: { subType: t.RIGHT_DOUBLE_CURLY } },
      { type: n.TEXT, value: `]` },
    ]);
  });

  it(`can handle comma after symbol`, () => {
    const parser = getParser(`David Binns\`', at Harrisville\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `David Binns` },
      { type: n.SYMBOL, value: `\`'`, meta: { subType: t.RIGHT_SINGLE_CURLY } },
      { type: n.TEXT, value: `, at Harrisville` },
    ]);
  });

  it(`can handle pound symbol`, () => {
    const parser = getParser(`fined £40\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `fined ` },
      { type: n.SYMBOL, value: `£`, meta: { subType: t.POUND_SYMBOL } },
      { type: n.TEXT, value: `40` },
    ]);
  });

  it(`can handle degree symbol`, () => {
    const parser = getParser(`62° above zero\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `62` },
      { type: n.SYMBOL, value: `°`, meta: { subType: t.DEGREE_SYMBOL } },
      { type: n.TEXT, value: ` above zero` },
    ]);
  });

  it(`can handle line starting with parens`, () => {
    const parser = getParser(`(hello)\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ type: n.TEXT, value: `(hello)` });
  });

  it(`can handle parens after emphasis`, () => {
    const parser = getParser(`Hello (there _world_)\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `Hello (there ` },
      { type: n.EMPHASIS, children: [{ type: n.TEXT, value: `world` }] },
      { type: n.TEXT, value: `)` },
    ]);
  });

  it(`can handle dot after symbol`, () => {
    const parser = getParser(`Dined at Josiah Evans\`'. After\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `Dined at Josiah Evans` },
      { type: n.SYMBOL, value: `\`'`, meta: { subType: t.RIGHT_SINGLE_CURLY } },
      { type: n.TEXT, value: `. After` },
    ]);
  });

  test(`line starting with dot not implmented, thus error`, () => {
    expect(() => getParser(`.Hello`).parseUntil(getPara(), t.EOL)).toThrow(
      /not implemented/,
    );
  });

  it(`can handle right single curlies`, () => {
    const parser = getParser(`priest\`'s\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `priest` },
      { type: n.SYMBOL, value: `\`'`, meta: { subType: t.RIGHT_SINGLE_CURLY } },
      { type: n.TEXT, value: `s` },
    ]);
  });

  test(`[.book-title]#<title># correctly parsed`, () => {
    const parser = getParser(`[.book-title]#Apology#\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      type: n.INLINE,
      context: { classList: [`book-title`] },
      children: [{ type: n.TEXT, value: `Apology` }],
    });
  });

  test(`[.book-title]#<title># spanning multiple lines correctly parsed`, () => {
    const parser = getParser(`[.book-title]#Barclay\nApology#\n\n`);
    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      type: n.INLINE,
      context: { classList: [`book-title`] },
      children: [{ type: n.TEXT, value: `Barclay Apology` }],
    });
  });

  test(`RIGHT_BRACKET in standard context consumed as text`, () => {
    const parser = getParser(`Hello world]\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      type: n.TEXT,
      value: `Hello world]`,
    });
  });

  test(`unambiguous content brackets consumed as text`, () => {
    const parser = getParser(`[Hello] world\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      type: n.TEXT,
      value: `[Hello] world`,
    });
  });

  it(`can handle triple-plus passthrough`, () => {
    const parser = getParser(`+++[+++mark\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(2);
    expect(nodes).toMatchObject([
      { type: n.INLINE_PASSTHROUGH, value: `[` },
      { type: n.TEXT, value: `mark` },
    ]);
  });

  it(`can handle symbols at end of line`, () => {
    const parser = getParser(`world.\`"\nHello\n\n`);
    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `world.` },
      { type: n.SYMBOL, value: `\`"`, meta: { subType: t.RIGHT_DOUBLE_CURLY } },
      { type: n.TEXT, value: ` Hello` },
    ]);
  });

  it(`can handle emphasis child nodes`, () => {
    const parser = getParser(`Hello _world_ foo\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `Hello ` },
      { type: n.EMPHASIS, children: [{ type: n.TEXT, value: `world` }] },
      { type: n.TEXT, value: ` foo` },
    ]);
    expect(nodes[1]!.endToken).toMatchObject({
      type: t.UNDERSCORE,
      literal: `_`,
    });
  });

  it(`can handle STRONG child nodes`, () => {
    const parser = getParser(`Hello **world** foo\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `Hello ` },
      { type: n.STRONG, children: [{ type: n.TEXT, value: `world` }] },
      { type: n.TEXT, value: ` foo` },
    ]);
  });

  test(`nested nodes`, () => {
    const parser = getParser(`Hello **_world_** foo\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `Hello ` },
      {
        type: n.STRONG,
        children: [
          {
            type: n.EMPHASIS,
            children: [
              {
                type: n.TEXT,
                value: `world`,
              },
            ],
          },
        ],
      },
      { type: n.TEXT, value: ` foo` },
    ]);
  });

  it(`throws if node doesn't close properly`, () => {
    const parser = getParser(`_Hello\n`);
    expect(() => parser.parseUntil(getPara(), t.EOL)).toThrow(/unclosed/i);
  });

  it(`throws if nodes close out of order`, () => {
    const parser = getParser(`_Hello **world_ foo**\n`);
    expect(() => parser.parseUntil(getPara(), t.EOL)).toThrow(/unclosed STRONG/i);
  });

  it(`can move through newlines`, () => {
    const parser = getParser(`Hello\nworld\n\n`);
    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ type: n.TEXT, value: `Hello world` });
  });

  it(`doesn't move through newlines, if should stop`, () => {
    const parser = getParser(`Hello\nworld\n\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ type: n.TEXT, value: `Hello` });
  });
});
