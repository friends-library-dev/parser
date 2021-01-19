import { AstNode, NODE as n } from '../types';
import BlockParser from '../parsers/BlockParser';
import { assertAllNodesHaveTokens, getChapter, getParser } from './helpers';
import stripIndent from 'strip-indent';

describe(`BlockParser.parse()`, () => {
  it(`can parse a simple paragraph`, () => {
    const block = getParsedBlock(`
      Hello world
    `);
    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      children: [
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: 'Hello world' }],
        },
      ],
    });
  });

  it(`skips over comment lines`, () => {
    const block = getParsedBlock(`
      Hello world
      // lint-disable
      goodbye world
    `);
    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      children: [
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: 'Hello world goodbye world' }],
        },
      ],
    });
  });

  it(`can parse description lists`, () => {
    const block = getParsedBlock(`
      Hello:: world

      Beep::
      Goodbye world
    `);
    assertAllNodesHaveTokens(block);
    expect(block.toJSON()).toMatchObject({
      type: n.DESCRIPTION_LIST,
      children: [
        {
          type: n.DESCRIPTION_LIST_ITEM,
          children: [
            {
              type: n.DESCRIPTION_LIST_ITEM_TERM,
              children: [{ type: n.TEXT, value: `Hello` }],
            },
            {
              type: n.DESCRIPTION_LIST_ITEM_CONTENT,
              children: [{ type: n.TEXT, value: `world` }],
            },
          ],
        },
        {
          type: n.DESCRIPTION_LIST_ITEM,
          children: [
            {
              type: n.DESCRIPTION_LIST_ITEM_TERM,
              children: [{ type: n.TEXT, value: `Beep` }],
            },
            {
              type: n.DESCRIPTION_LIST_ITEM_CONTENT,
              children: [{ type: n.TEXT, value: `Goodbye world` }],
            },
          ],
        },
      ],
    });
  });

  it(`can parse a paragraph with context`, () => {
    const block = getParsedBlock(`
      [quote, ,]
      ____
      First para

      [.offset]
      With context

      Last para
      ____
    `);
    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      meta: { subType: `quote` },
      children: [
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: 'First para' }],
        },
        {
          type: n.PARAGRAPH,
          context: { classList: [`offset`] },
          children: [{ type: n.TEXT, value: 'With context' }],
        },
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: 'Last para' }],
        },
      ],
    });
  });

  it(`can parse a blockquote`, () => {
    const block = getParsedBlock(`
      [quote, ,]
      ____
      Hello world
      ____
    `);

    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      context: { type: `quote` },
      children: [
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: 'Hello world' }],
        },
      ],
    });
  });

  it(`can parse a blockquote with multiple paragraphs`, () => {
    const block = getParsedBlock(`
      [quote, ,]
      ____
      Hello world

      Goodbye world

      Hello
      Papa
      ____
    `);

    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      context: { type: `quote` },
      children: [
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: 'Hello world' }],
        },
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: 'Goodbye world' }],
        },
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: 'Hello Papa' }],
        },
      ],
    });
  });

  it(`can parse an example block within an open-block`, () => {
    const block = getParsedBlock(`
      [.embedded-content-document.letter]
      --

      Hello world

      [.postscript]
      ====

      PS Goodbye

      ====

      --
    `);

    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      meta: { subType: `open` },
      context: { classList: [`embedded-content-document`, `letter`] },
      children: [
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: `Hello world` }],
        },
        {
          type: n.BLOCK,
          meta: { subType: `example` },
          context: { classList: [`postscript`] },
          children: [
            {
              type: n.PARAGRAPH,
              children: [{ type: n.TEXT, value: `PS Goodbye` }],
            },
          ],
        },
      ],
    });
  });

  it(`can parse an open-block`, () => {
    const block = getParsedBlock(`
      [.embedded-content-document.letter]
      --

      [.salutation]
      Dear friend

      Hello friend

      [.signed-section-signature]
      George

      --
    `);

    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      meta: { subType: `open` },
      context: { classList: [`embedded-content-document`, `letter`] },
      children: [
        {
          type: n.PARAGRAPH,
          context: { classList: [`salutation`] },
          children: [{ type: n.TEXT, value: `Dear friend` }],
        },
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: `Hello friend` }],
        },
        {
          type: n.PARAGRAPH,
          context: { classList: [`signed-section-signature`] },
          children: [{ type: n.TEXT, value: `George` }],
        },
      ],
    });
  });

  it(`can parse an example-block`, () => {
    const block = getParsedBlock(`
      [.postscript]
      ====

      Hello world

      ====
    `);

    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      meta: { subType: `example` },
      context: { classList: [`postscript`] },
      children: [
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: `Hello world` }],
        },
      ],
    });
  });

  it(`can parse an asterism`, () => {
    const asterism = getParsedBlock(`
      [.asterism]
      '''
    `);
    expect(asterism.toJSON()).toMatchObject({
      type: n.THEMATIC_BREAK,
      context: { classList: [`asterism`] },
    });
    assertAllNodesHaveTokens(asterism);
  });

  it(`can parse an with something after it`, () => {
    const asterism = getParsedBlock(`
      [.asterism]
      '''

      Hello world
    `);
    expect(asterism.toJSON()).toMatchObject({
      type: n.THEMATIC_BREAK,
      context: { classList: [`asterism`] },
    });
  });

  it(`can parse an asterism within another block`, () => {
    const block = getParsedBlock(`
      [.embedded-content-document]
      --

      Hello world

      [.asterism]
      '''

      --
    `);
    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      meta: { subType: `open` },
      children: [
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: `Hello world` }],
        },
        {
          type: n.THEMATIC_BREAK,
          context: { classList: [`asterism`] },
        },
      ],
    });
  });

  it(`can parse a heading within an open block`, () => {
    const block = getParsedBlock(`
      [.embedded-content-document]
      --

      === Subheading

      Hello world

      --
    `);
    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      meta: { subType: `open` },
      children: [
        {
          type: n.HEADING,
          meta: { level: 3 },
          children: [{ type: n.TEXT, value: `Subheading` }],
        },
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: `Hello world` }],
        },
      ],
    });
  });

  it(`can parse a verse block`, () => {
    const block = getParsedBlock(`
      [verse]
      ____
      Hello Mama
      Hello Papa
      ____
    `);
    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      meta: { subType: `verse` },
      children: [
        {
          type: n.VERSE_STANZA,
          children: [
            { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Hello Mama` }] },
            { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Hello Papa` }] },
          ],
        },
      ],
    });
  });

  it(`can parse a multi-stanza verse block`, () => {
    const block = getParsedBlock(`
      [verse]
      ____
      Hello Mama
      Hello Papa

      Hello Mama
      Hello Papa
      ____
    `);
    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      meta: { subType: `verse` },
      children: [
        {
          type: n.VERSE_STANZA,
          children: [
            { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Hello Mama` }] },
            { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Hello Papa` }] },
          ],
        },
        {
          type: n.VERSE_STANZA,
          children: [
            { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Hello Mama` }] },
            { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Hello Papa` }] },
          ],
        },
      ],
    });
  });

  it(`can parse an verse block within an open-block`, () => {
    const block = getParsedBlock(`
      [.embedded-content-document.letter]
      --

      Hello world

      [verse]
      ____
      Hello Mama
      Hello Papa
      ____

      --
    `);

    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      meta: { subType: `open` },
      context: { classList: [`embedded-content-document`, `letter`] },
      children: [
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: `Hello world` }],
        },
        {
          type: n.BLOCK,
          meta: { subType: `verse` },
          children: [
            {
              type: n.VERSE_STANZA,
              children: [
                { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Hello Mama` }] },
                { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Hello Papa` }] },
              ],
            },
          ],
        },
      ],
    });
  });

  it(`can parse a list block`, () => {
    const block = getParsedBlock(`
      [.chapter-synopsis]
      * Hello Mama
      * Hello Papa
    `);
    assertAllNodesHaveTokens(block);
    expect(block.toJSON()).toMatchObject({
      type: n.UNORDERED_LIST,
      context: { classList: [`chapter-synopsis`] },
      children: [
        {
          type: n.LIST_ITEM,
          children: [{ type: n.TEXT, value: `Hello Mama` }],
        },
        {
          type: n.LIST_ITEM,
          children: [{ type: n.TEXT, value: `Hello Papa` }],
        },
      ],
    });
  });
});

function getParsedBlock(adoc: string): AstNode {
  const parser = getParser(stripIndent(adoc).trim() + `\n`);
  const blockParser = new BlockParser(parser);
  return blockParser.parse(getChapter());
}
