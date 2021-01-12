import { NODE as n, TOKEN as t } from '../types';
import { getPara, getParser, parseAdocFile } from './helpers';

describe(`Parser.parseContext()`, () => {
  test(`parsing basic context`, () => {
    const parser = getParser(`[.offset]\n`);
    const context = parser.parseContext();
    expect(context?.classList).toMatchObject([`offset`]);
  });
});

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

describe(`Parser.parse()`, () => {
  it(`can parse a hello-world chapter`, () => {
    const document = parseAdocFile(`
      == Chapter 1
      
      Hello world
    `);
    expect(document.toJSON()).toMatchObject({
      type: n.DOCUMENT,
      children: [
        {
          type: n.CHAPTER,
          children: [
            {
              type: n.HEADING,
              children: [{ type: n.TEXT, value: 'Chapter 1' }],
              level: 2,
            },
            {
              type: n.BLOCK,
              children: [
                {
                  type: n.PARAGRAPH,
                  children: [{ type: n.TEXT, value: 'Hello world' }],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it(`can parse a sub-section`, () => {
    const document = parseAdocFile(`
      == Chapter 1
      
      === Subsection

      Hello world
    `);

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
              type: n.SECTION,
              level: 3,
              children: [
                {
                  type: n.HEADING,
                  children: [{ type: n.TEXT, value: `Subsection` }],
                  level: 3,
                },
                {
                  type: n.BLOCK,
                  children: [
                    {
                      type: n.PARAGRAPH,
                      children: [{ type: n.TEXT, value: `Hello world` }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it(`can parse contexts on chapter-level blocks`, () => {
    const document = parseAdocFile(`
      == Chapter 1

      [.offset]
      Hello world
    `);

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
              type: n.BLOCK,
              context: { classList: [`offset`] },
              children: [
                {
                  type: n.PARAGRAPH,
                  children: [{ type: n.TEXT, value: `Hello world` }],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it(`can parse contexts on sections`, () => {
    const document = parseAdocFile(`
      == Chapter 1

      [.blurb]
      === Subsection

      Hello world
    `);

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
              type: n.SECTION,
              level: 3,
              context: { classList: [`blurb`] },
              children: [
                {
                  type: n.HEADING,
                  level: 3,
                  children: [{ type: n.TEXT, value: `Subsection` }],
                },
                {
                  type: n.BLOCK,
                  children: [
                    {
                      type: n.PARAGRAPH,
                      children: [{ type: n.TEXT, value: `Hello world` }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it(`can parse something in a heading`, () => {
    const document = parseAdocFile(`
      == Chapter _emphasis_

      Hello world
    `);
    const heading = document.children[0]!.children[0]!;
    expect(heading.toJSON().children).toMatchObject([
      { type: n.TEXT, value: `Chapter ` },
      { type: n.EMPHASIS, children: [{ type: n.TEXT, value: `emphasis` }] },
    ]);
  });

  it(`can parse document epigraphs`, () => {
    const document = parseAdocFile(`
      [quote.epigraph, , John 1:1]
      ____
      Epigraph 1
      ____

      [quote.epigraph, , John 1:2]
      ____
      Epigraph 2
      ____

      == Chapter 1

      Hello world
    `);

    expect(document.epigraphs).toMatchObject([
      {
        type: n.BLOCK,
        blockType: `quote`,
        context: {
          quoteSource: [{ literal: `John` }, { literal: ` ` }, { literal: `1:1` }],
        },
        children: [
          {
            type: n.PARAGRAPH,
            children: [{ type: n.TEXT, value: `Epigraph 1` }],
          },
        ],
      },
      {
        type: n.BLOCK,
        blockType: `quote`,
        context: {
          quoteSource: [{ literal: `John` }, { literal: ` ` }, { literal: `1:2` }],
        },
        children: [
          {
            type: n.PARAGRAPH,
            children: [{ type: n.TEXT, value: `Epigraph 2` }],
          },
        ],
      },
    ]);
  });
});
