import stripIndent from 'strip-indent';
import Parser from '../Parser';
import Lexer from '../lexer';
import { NODE as n, TOKEN as t } from '../types';
import ParagraphNode from '../nodes/ParagraphNode';
import DocumentNode from '../nodes/DocumentNode';

// error if parse until doesn't find
// stop stack

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

  it(`throws if node doesn't close properly`, () => {
    const parser = getParser(`_Hello\n`);
    expect(() => parser.parseUntil(getPara(), t.EOL)).toThrow(/unclosed/i);
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
