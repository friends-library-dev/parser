import stripIndent from 'strip-indent';
import Parser from '../Parser';
import Lexer from '../lexer';
import { NODE as n, TOKEN as t } from '../types';
import ParagraphNode from '../nodes/ParagraphNode';
import DocumentNode from '../nodes/DocumentNode';

describe(`Parse.parseUntil()`, () => {
  it(`can handle text nodes`, () => {
    const parser = getParser(`Hello world\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      type: n.TEXT,
      value: `Hello world`,
    });
  });

  it(`can handle emphasis child nodes`, () => {
    const parser = getParser(`Hello _world_ foo\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `Hello ` },
      { type: n.EMPHASIS, children: [{ type: n.TEXT, value: `world` }] },
      { type: n.TEXT, value: ` foo` },
    ]);
  });

  it(`can handle STRONG child nodes`, () => {
    const parser = getParser(`Hello **world** foo\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
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
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `Hello ` },
      {
        type: n.STRONG,
        children: [{ type: n.EMPHASIS, children: [{ type: n.TEXT, value: `world` }] }],
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
    const nodes = parser.parseUntil(getPara(), t.EOL, t.EOL);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ type: n.TEXT, value: `Hello world` });
  });

  it(`doesn't move through newlines, if should stop`, () => {
    const parser = getParser(`Hello\nworld\n\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ type: n.TEXT, value: `Hello` });
  });
});

function getParser(adoc: string): Parser {
  const lexer = new Lexer({ adoc });
  return new Parser(lexer);
}

function getPara(): ParagraphNode {
  return new ParagraphNode(new DocumentNode());
}

// epigraphs
// classname above section title
// footnotes

xdescribe(`Parser.parse()`, () => {
  it(`can parse a thing`, () => {
    const adoc = stripIndent(`
      == Chapter 1

      Hello world.
    `);

    const lexer = new Lexer({ adoc });
    const parser = new Parser(lexer);
    const document = parser.parse();

    expect(document.toJSON()).toMatchObject({
      type: n.DOCUMENT,
      children: [
        {
          type: n.CHAPTER,
          children: [
            {
              type: n.HEADING,
              level: 2,
              children: [{ type: n.TEXT, value: `Chapter 1` }],
            },
            {
              type: n.PARAGRAPH,
              children: [{ type: n.TEXT, value: `Hello world.` }],
            },
          ],
        },
      ],
    });
  });

  it(`can parse something in a heading`, () => {
    const adoc = stripIndent(`
        == Chapter 1
  
        Hello world.
      `);

    const lexer = new Lexer({ adoc });
    const parser = new Parser(lexer);
    const document = parser.parse();

    const heading = document.children[0]!.children[0]!;
    expect(heading.toJSON().children).toMatchObject([
      { type: n.TEXT, value: `Chapter 1` },
    ]);
  });
});