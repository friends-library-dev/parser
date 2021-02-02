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
          children: [{ type: n.TEXT, value: `Hello world` }],
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
          children: [{ type: n.TEXT, value: `Hello world goodbye world` }],
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
          children: [{ type: n.TEXT, value: `First para` }],
        },
        {
          type: n.PARAGRAPH,
          context: { classList: [`offset`] },
          children: [{ type: n.TEXT, value: `With context` }],
        },
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: `Last para` }],
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
          children: [{ type: n.TEXT, value: `Hello world` }],
        },
      ],
    });
  });

  it(`can parse a blockquote with a footnote`, () => {
    const block = getParsedBlock(`
      [quote, ,]
      ____
      Hello world^
      footnote:[herp derp]
      ____
    `);

    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      context: { type: `quote` },
      children: [
        {
          type: n.PARAGRAPH,
          children: [
            { type: n.TEXT, value: `Hello world` },
            {
              type: n.FOOTNOTE,
              children: [
                { type: n.PARAGRAPH, children: [{ type: n.TEXT, value: `herp derp` }] },
              ],
            },
          ],
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
          children: [{ type: n.TEXT, value: `Hello world` }],
        },
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: `Goodbye world` }],
        },
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: `Hello Papa` }],
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

      Goodbye

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
              children: [{ type: n.TEXT, value: `Goodbye` }],
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
          children: [
            { type: n.HEADING_TITLE, children: [{ type: n.TEXT, value: `Subheading` }] },
          ],
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

  test(`list item can have footnote`, () => {
    const block = getParsedBlock(`
      [.chapter-synopsis]
      * Hello Mama.footnote:[Beep Boop]
      * Hello Papa.
    `);
    assertAllNodesHaveTokens(block);
    expect(block.toJSON()).toMatchObject({
      type: n.UNORDERED_LIST,
      context: { classList: [`chapter-synopsis`] },
      children: [
        {
          type: n.LIST_ITEM,
          children: [
            { type: n.TEXT, value: `Hello Mama.` },
            {
              type: n.FOOTNOTE,
              children: [
                { type: n.PARAGRAPH, children: [{ type: n.TEXT, value: `Beep Boop` }] },
              ],
            },
          ],
        },
        {
          type: n.LIST_ITEM,
          children: [{ type: n.TEXT, value: `Hello Papa.` }],
        },
      ],
    });
  });

  it(`can parse a block passthrough`, () => {
    const block = getParsedBlock(`
      ++++
      <br />
      <br />
      ++++
    `);
    assertAllNodesHaveTokens(block);
    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK_PASSTHROUGH,
      value: `<br />\n<br />\n`,
    });
  });

  it(`can parse a block passthrough inside another group`, () => {
    const block = getParsedBlock(`
      [.numbered]
      ====

      ++++
      <br />
      <br />
      ++++

      ====
    `);
    assertAllNodesHaveTokens(block);
    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      meta: { subType: `example` },
      children: [
        {
          type: n.BLOCK_PASSTHROUGH,
          value: `<br />\n<br />\n`,
        },
      ],
    });
  });

  it(`handles finding discourse-part identifiers`, () => {
    const block = getParsedBlock(`
      [.discourse-part]
      Question: Hello world.
    `);
    assertAllNodesHaveTokens(block);
    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      context: { classList: [`discourse-part`] },
      children: [
        {
          type: n.PARAGRAPH,
          children: [
            { type: n.DISCOURSE_PART_IDENTIFIER, value: `Question:` },
            { type: n.TEXT, value: ` Hello world.` },
          ],
        },
      ],
    });
  });

  it(`handles manual discourse-part identifiers`, () => {
    const block = getParsedBlock(`
      [.discourse-part]
      __Landlord.__--So John, are you busy
    `);
    assertAllNodesHaveTokens(block);
    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      context: { classList: [`discourse-part`] },
      children: [
        {
          type: n.PARAGRAPH,
          children: [
            { type: n.DISCOURSE_PART_IDENTIFIER, value: `Landlord.` },
            { type: n.SYMBOL, meta: { subType: `DOUBLE_DASH` } },
            { type: n.TEXT, value: `So John, are you busy` },
          ],
        },
      ],
    });
  });

  const dpIdCases: Array<[string, string, string]> = [
    [`Question: Foo bar?`, `Question:`, ` Foo bar`],
    [`Question. After period,`, `Question.`, ` After period,`],
    [`Answer:\nNext line.`, `Answer:`, ` Next line.`],
    [`Answer 143: Hash baz`, `Answer 143:`, ` Hash baz`],
    [`Objection: Herp`, `Objection:`, ` Herp`],
    [`Inquiry 13:\nBeep`, `Inquiry 13:`, ` Beep`],
    [`Pregunta: Herp`, `Pregunta:`, ` Herp`],
    [`Respuesta: Herp`, `Respuesta:`, ` Herp`],
    [`Respuesta: Herp`, `Respuesta:`, ` Herp`],
  ];

  test.each(dpIdCases)(`"%s" broken into [%s] and [%s]`, (input, id, textAfter) => {
    const block = getParsedBlock(`[.discourse-part]\n${input}`);
    assertAllNodesHaveTokens(block);
    expect(block.children[0]?.children.slice(0, 2).map((c) => c.toJSON())).toMatchObject([
      { type: n.DISCOURSE_PART_IDENTIFIER, value: id },
      { type: n.TEXT, value: textAfter },
    ]);
  });

  it(`handles finding postscript identifiers`, () => {
    const block = getParsedBlock(`
      [.postscript]
      ====

      Postscript.--Hello world.

      ====
    `);
    assertAllNodesHaveTokens(block);
    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      context: { classList: [`postscript`] },
      children: [
        {
          type: n.PARAGRAPH,
          children: [
            { type: n.POSTSCRIPT_IDENTIFIER, value: `Postscript.` },
            { type: n.SYMBOL, meta: { subType: `DOUBLE_DASH` } },
            { type: n.TEXT, value: `Hello world.` },
          ],
        },
      ],
    });
  });

  const psIdCases: Array<[string, string, string]> = [
    [`P+++.+++ S. Foobar`, `P. S.`, ` Foobar`],
    [`P. S. Foobar`, `P. S.`, ` Foobar`],
    [`PS: Foobar`, `PS:`, ` Foobar`],
    [`P. S.Foobar`, `P. S.`, `Foobar`],
    [`P.S. Foobar`, `P.S.`, ` Foobar`],
    [`PS Foobar`, `PS`, ` Foobar`],
    [`PS. Foobar`, `PS.`, ` Foobar`],
    [`Postscript Foobar`, `Postscript`, ` Foobar`],
    [`Postscript. Foobar`, `Postscript.`, ` Foobar`],
    [`PostScript Foobar`, `Postscript`, ` Foobar`],
    [`N+++.+++ B. Foobar`, `N. B.`, ` Foobar`],
    [`N+++.+++B. Foobar`, `N.B.`, ` Foobar`],
    [`NB: Foobar`, `NB:`, ` Foobar`],
    [`N.B. Foobar`, `N.B.`, ` Foobar`],
    // spanish
    [`P+++.+++ D. Foobar`, `P. D.`, ` Foobar`],
    [`P. D. Foobar`, `P. D.`, ` Foobar`],
    [`PD: Foobar`, `PD:`, ` Foobar`],
    [`P. D.Foobar`, `P. D.`, `Foobar`],
    [`P.D. Foobar`, `P.D.`, ` Foobar`],
    [`PD Foobar`, `PD`, ` Foobar`],
    [`PD. Foobar`, `PD.`, ` Foobar`],
    [`Posdata Foobar`, `Posdata`, ` Foobar`],
    [`Posdata. Foobar`, `Posdata.`, ` Foobar`],
    [`PosData Foobar`, `Posdata`, ` Foobar`],
  ];

  test.each(psIdCases)(`"%s" broken into [%s] and [%s]`, (input, id, textAfter) => {
    const block = getParsedBlock(`[.postscript]\n====\n\n${input}\n\n====\n`);
    assertAllNodesHaveTokens(block);
    expect(block.children[0]?.children.slice(0, 2).map((c) => c.toJSON())).toMatchObject([
      { type: n.POSTSCRIPT_IDENTIFIER, value: id },
      { type: n.TEXT, value: textAfter },
    ]);
  });
});

function getParsedBlock(adoc: string): AstNode {
  const parser = getParser(stripIndent(adoc).trim() + `\n`);
  const blockParser = new BlockParser(parser);
  return blockParser.parse(getChapter());
}
