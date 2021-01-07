import { NODE as n, TOKEN as t } from '../types';
import { getPara, getParser, parseAdocFile } from './helpers';

describe(`Parser.parseContext()`, () => {
  test(`it works`, () => {
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
      type: 'DOCUMENT',
      children: [
        {
          type: 'CHAPTER',
          children: [
            {
              type: 'HEADING',
              children: [{ type: 'TEXT', value: 'Chapter 1' }],
              level: 2,
            },
            {
              type: 'BLOCK',
              children: [
                {
                  type: 'PARAGRAPH',
                  children: [{ type: 'TEXT', value: 'Hello world' }],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it.only(`can parse a sub-section`, () => {
    const document = parseAdocFile(`
      == Chapter 1
      
      === Subsection

      Hello world
    `);

    document.log();
    expect(document.toJSON()).toMatchObject({
      type: 'DOCUMENT',
      children: [
        {
          type: 'CHAPTER',
          children: [
            {
              type: 'SECTION',
              level: 3,
              children: [
                {
                  type: 'BLOCK',
                  children: [
                    {
                      type: 'PARAGRAPH',
                      children: [{ type: t.TEXT, value: `HELLO WORLD` }],
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
});
