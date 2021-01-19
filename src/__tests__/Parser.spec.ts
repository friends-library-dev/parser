import DocumentNode from '../nodes/DocumentNode';
import { NODE as n, TOKEN as t } from '../types';
import { assertAllNodesHaveTokens, getParser, parseAdocFile } from './helpers';

describe(`Parser.parseContext()`, () => {
  test(`parsing basic context`, () => {
    const parser = getParser(`[.offset]\n`);
    const context = parser.parseContext();
    expect(context?.classList).toMatchObject([`offset`]);
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
              meta: { level: 2 },
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

  it(`can parse a chapter with heading starting with a symbol`, () => {
    const document = parseAdocFile(`
      == '\`Tis a Chapter Title
      
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
              children: [
                { type: n.SYMBOL, value: `'\``, meta: { subType: 'LEFT_SINGLE_CURLY' } },
                { type: n.TEXT, value: 'Tis a Chapter Title' },
              ],
              meta: { level: 2 },
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

  it(`can parse a comment line`, () => {
    const document = parseAdocFile(`
      == Chapter 1
      
      // here is a comment
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
              meta: { level: 2 },
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

  it(`attaches start and end tokens to nodes`, () => {
    const document = parseAdocFile(`
      == Chapter 1
      
      Hello world
    `);
    expect(document.startToken).toMatchObject({
      type: t.EQUALS,
      literal: `==`,
      line: 1,
      column: { start: 1, end: 2 },
    });
    expect(document.endToken).toMatchObject({
      type: t.EOD,
      literal: ``,
      line: 3,
      column: { start: 12, end: 12 },
    });

    const chapter = document.children[0]!;
    expect(chapter.startToken).toMatchObject({
      type: t.EQUALS,
      literal: `==`,
      line: 1,
      column: { start: 1, end: 2 },
    });
    expect(chapter.endToken).toMatchObject({
      type: t.TEXT,
      literal: `world`,
      line: 3,
      column: { start: 7, end: 11 },
    });

    const heading = chapter.children[0]!;
    expect(heading.startToken).toMatchObject({
      type: t.EQUALS,
      literal: `==`,
      line: 1,
      column: { start: 1, end: 2 },
    });
    expect(heading.endToken).toMatchObject({
      type: t.TEXT,
      literal: `1`,
      line: 1,
      column: { start: 12, end: 12 },
    });

    const headingText = heading.children[0]!;
    expect(headingText.startToken).toMatchObject({
      type: t.TEXT,
      literal: `Chapter`,
      line: 1,
      column: { start: 4, end: 10 },
    });
    expect(headingText.endToken).toMatchObject({
      type: t.TEXT,
      literal: `1`,
      line: 1,
      column: { start: 12, end: 12 },
    });

    const block = chapter.children[1]!;
    expect(block.startToken).toMatchObject({
      type: t.TEXT,
      literal: `Hello`,
      line: 3,
      column: { start: 1, end: 5 },
    });
    expect(block.endToken).toMatchObject({
      type: t.TEXT,
      literal: `world`,
      line: 3,
      column: { start: 7, end: 11 },
    });

    assertAllNodesHaveTokens(document);
  });

  it(`can handle context on chapter heading`, () => {
    const document = parseAdocFile(`
      [#ch1]
      == Chapter 1
      
      Hello world
    `);
    expect(document.toJSON()).toMatchObject({
      type: n.DOCUMENT,
      children: [
        {
          type: n.CHAPTER,
          context: { id: `ch1` },
          children: [
            {
              type: n.HEADING,
              children: [{ type: n.TEXT, value: 'Chapter 1' }],
              meta: { level: 2 },
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

  it(`can handle section with multiple paragraphs`, () => {
    const document = parseAdocFile(`
      [#ch1]
      == Chapter 1
      
      Hello world

      Goodbye world
    `);
    expect(document.toJSON()).toMatchObject({
      type: n.DOCUMENT,
      children: [
        {
          type: n.CHAPTER,
          context: { id: `ch1` },
          children: [
            {
              type: n.HEADING,
              children: [{ type: n.TEXT, value: 'Chapter 1' }],
              meta: { level: 2 },
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
            {
              type: n.BLOCK,
              children: [
                {
                  type: n.PARAGRAPH,
                  children: [{ type: n.TEXT, value: 'Goodbye world' }],
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
              meta: { level: 2 },
              children: [{ type: n.TEXT, value: `Chapter 1` }],
            },
            {
              type: n.SECTION,
              meta: { level: 3 },
              children: [
                {
                  type: n.HEADING,
                  children: [{ type: n.TEXT, value: `Subsection` }],
                  meta: { level: 3 },
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

  it(`can parse a sections decreasing by one`, () => {
    const document = parseAdocFile(`
      == Chapter 1
      
      === Level 3

      ==== Level 4

      === Back to level 3

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
              meta: { level: 2 },
              children: [{ type: n.TEXT, value: `Chapter 1` }],
            },
            {
              type: n.SECTION,
              meta: { level: 3 },
              children: [
                {
                  type: n.HEADING,
                  children: [{ type: n.TEXT, value: `Level 3` }],
                  meta: { level: 3 },
                },
                {
                  type: n.SECTION,
                  meta: { level: 4 },
                  children: [
                    {
                      type: n.HEADING,
                      meta: { level: 4 },
                      children: [{ type: n.TEXT, value: `Level 4` }],
                    },
                  ],
                },
              ],
            },
            {
              type: n.SECTION,
              meta: { level: 3 },
              children: [
                {
                  type: n.HEADING,
                  meta: { level: 3 },
                  children: [{ type: n.TEXT, value: `Back to level 3` }],
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
              meta: { level: 2 },
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
              meta: { level: 2 },
              children: [{ type: n.TEXT, value: `Chapter 1` }],
            },
            {
              type: n.SECTION,
              meta: { level: 3 },
              context: { classList: [`blurb`] },
              children: [
                {
                  type: n.HEADING,
                  meta: { level: 3 },
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

  test(`sub-sections of same level close previous section`, () => {
    const document = parseAdocFile(`
      == Chapter 1

      === Subsection 1

      Hello world

      === Subsection 2

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
              meta: { level: 2 },
              children: [{ type: n.TEXT, value: `Chapter 1` }],
            },
            {
              type: n.SECTION,
              meta: { level: 3 },
              children: [
                {
                  type: n.HEADING,
                  meta: { level: 3 },
                  children: [{ type: n.TEXT, value: `Subsection 1` }],
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
            {
              type: n.SECTION,
              meta: { level: 3 },
              children: [
                {
                  type: n.HEADING,
                  meta: { level: 3 },
                  children: [{ type: n.TEXT, value: `Subsection 2` }],
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
    expect((document as DocumentNode).epigraphs).toMatchObject([
      {
        type: n.BLOCK,
        meta: { subType: `quote` },
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
        meta: { subType: `quote` },
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

  test(`chapter-synopsis`, () => {
    const document = parseAdocFile(`
      == Chapter 1

      [.chapter-synopsis]
      * Item 1
      * Item 2

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
              meta: { level: 2 },
              children: [{ type: n.TEXT, value: `Chapter 1` }],
            },
            {
              type: n.UNORDERED_LIST,
              context: { classList: [`chapter-synopsis`] },
              children: [
                {
                  type: n.LIST_ITEM,
                  children: [{ type: n.TEXT, value: `Item 1` }],
                },
                {
                  type: n.LIST_ITEM,
                  children: [{ type: n.TEXT, value: `Item 2` }],
                },
              ],
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
    });
  });

  test(`numbered-groups not nested`, () => {
    const document = parseAdocFile(`
      == Chapter 1

      Hello world

      [.numbered-group]
      ====

      [.numbered]
      First

      [.numbered]
      Second

      ====
    `);

    assertAllNodesHaveTokens(document);
    expect(document.toJSON()).toMatchObject({
      type: n.DOCUMENT,
      children: [
        {
          type: n.CHAPTER,
          children: [
            {
              type: n.HEADING,
              meta: { level: 2 },
              children: [{ type: n.TEXT, value: `Chapter 1` }],
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
            {
              type: n.BLOCK,
              children: [
                {
                  type: n.PARAGRAPH,
                  context: { classList: [`numbered`] },
                  children: [{ type: n.TEXT, value: `First` }],
                },
                {
                  type: n.PARAGRAPH,
                  context: { classList: [`numbered`] },
                  children: [{ type: n.TEXT, value: `Second` }],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  test(`third-level heading inside of numbered group inside of embedded-content-doc`, () => {
    const document = parseAdocFile(`
      == Chapter 1

      [.embedded-content-document]
      --

      [.numbered-group]
      ====

      === Subheading

      [.numbered]
      First

      ====

      --
    `);

    assertAllNodesHaveTokens(document);
    expect(document.toJSON()).toMatchObject({
      type: n.DOCUMENT,
      children: [
        {
          type: n.CHAPTER,
          children: [
            {
              type: n.HEADING,
              meta: { level: 2 },
              children: [{ type: n.TEXT, value: `Chapter 1` }],
            },
            {
              type: n.BLOCK,
              meta: { subType: `open` },
              context: { classList: [`embedded-content-document`] },
              children: [
                {
                  type: n.BLOCK,
                  meta: { subType: `example` },
                  context: { classList: [`numbered-group`] },
                  children: [
                    {
                      type: n.HEADING,
                      children: [{ type: n.TEXT, value: `Subheading` }],
                    },
                    {
                      type: n.PARAGRAPH,
                      context: { classList: [`numbered`] },
                      children: [{ type: n.TEXT, value: `First` }],
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

  test(`syllogism inside embedded-doc`, () => {
    const document = parseAdocFile(`
      == Chapter 1

      [.embedded-content-document]
      --

      Hello world

      [.syllogism]
      * Herp
      * Derp
      
      --
    `);

    assertAllNodesHaveTokens(document);
    expect(document.toJSON()).toMatchObject({
      type: n.DOCUMENT,
      children: [
        {
          type: n.CHAPTER,
          children: [
            {
              type: n.HEADING,
              meta: { level: 2 },
              children: [{ type: n.TEXT, value: `Chapter 1` }],
            },
            {
              type: n.BLOCK,
              context: { classList: [`embedded-content-document`] },
              meta: { subType: `open` },
              children: [
                {
                  type: n.PARAGRAPH,
                  children: [{ type: n.TEXT, value: `Hello world` }],
                },
                {
                  type: n.UNORDERED_LIST,
                  children: [
                    {
                      type: n.LIST_ITEM,
                      children: [{ type: n.TEXT, value: `Herp` }],
                    },
                    {
                      type: n.LIST_ITEM,
                      children: [{ type: n.TEXT, value: `Derp` }],
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
});
