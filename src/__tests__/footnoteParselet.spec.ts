import stripIndent from 'strip-indent';
import { TOKEN as t, NODE as n } from '../types';
import { getPara, getParser, assertAllNodesHaveTokens } from './helpers';

describe(`Parser.parseUntil() using parselets`, () => {
  it(`can handle sameline footnotes`, () => {
    const parser = getParser(`Hello worldfootnote:[Hello]\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    expect(nodes).toHaveLength(2);
    expect(nodes).toMatchObject([
      {
        type: n.TEXT,
        value: `Hello world`,
      },
      {
        type: n.FOOTNOTE,
        children: [{ type: n.PARAGRAPH, children: [{ type: n.TEXT, value: `Hello` }] }],
      },
    ]);
  });

  it(`can handle footnotes not ending at EOL`, () => {
    const parser = getParser(`Hello world^\nfootnote:[Hello]? For\n\n`);
    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `Hello world` },
      {
        type: n.FOOTNOTE,
        children: [{ type: n.PARAGRAPH, children: [{ type: n.TEXT, value: `Hello` }] }],
      },
      { type: n.TEXT, value: `? For` },
    ]);
  });

  it(`can handle footnotes with book title`, () => {
    const parser = getParser(`Hello world^\nfootnote:[[.book-title]#Apology# Hello]\n\n`);
    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    expect(nodes).toHaveLength(2);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `Hello world` },
      {
        type: n.FOOTNOTE,
        children: [
          {
            type: n.PARAGRAPH,
            children: [
              {
                type: n.INLINE,
                context: { classList: [`book-title`] },
                children: [{ type: n.TEXT, value: `Apology` }],
              },
              { type: n.TEXT, value: ` Hello` },
            ],
          },
        ],
      },
    ]);
  });

  it(`can handle footnotes with escaped right brackets`, () => {
    const parser = getParser(`Hello world^\nfootnote:[[Hello+++]+++]? For\n\n`);
    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      { type: n.TEXT, value: `Hello world` },
      {
        type: n.FOOTNOTE,
        children: [
          {
            type: n.PARAGRAPH,
            children: [
              { type: n.TEXT, value: `[Hello` },
              { type: n.INLINE_PASSTHROUGH, value: `]` },
            ],
          },
        ],
      },
      { type: n.TEXT, value: `? For` },
    ]);
  });

  it(`can handle caret-started footnotes`, () => {
    const parser = getParser(`Hello world.^\nfootnote:[Hello]\n\n`);
    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    expect(nodes).toHaveLength(2);
    expect(nodes).toMatchObject([
      {
        type: n.TEXT,
        value: `Hello world.`,
      },
      {
        type: n.FOOTNOTE,
        children: [{ type: n.PARAGRAPH, children: [{ type: n.TEXT, value: `Hello` }] }],
      },
    ]);
    expect(nodes[1]!.endToken).toMatchObject({ type: t.RIGHT_BRACKET });
  });

  it(`can handle multi-paragraph footnotes`, () => {
    const parser = getParser(
      `Hello world.^\nfootnote:[Hello.\n{footnote-paragraph-split}\nGoodbye.]\n\n`,
    );
    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(2);
    expect(nodes).toMatchObject([
      {
        type: n.TEXT,
        value: `Hello world.`,
      },
      {
        type: n.FOOTNOTE,
        children: [
          { type: n.PARAGRAPH, children: [{ type: n.TEXT, value: `Hello.` }] },
          { type: n.PARAGRAPH, children: [{ type: n.TEXT, value: `Goodbye.` }] },
        ],
      },
    ]);
  });

  test(`empty footnote is illegal`, () => {
    expect(() =>
      getParser(`Hello world.footnote:[]\n`).parseUntil(getPara(), t.EOL),
    ).toThrow(/empty footnote/);
  });

  test(`footnote poetry`, () => {
    const parser = getParser(
      stripIndent(`
Hello world.^
footnote:[Herp derp
\`    Beep
     Boop \`]
    `).trim() + `\n\n`,
    );

    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(2);
    expect(nodes).toMatchObject([
      {
        type: n.TEXT,
        value: `Hello world.`,
      },
      {
        type: n.FOOTNOTE,
        children: [
          { type: n.PARAGRAPH, children: [{ type: n.TEXT, value: `Herp derp` }] },
          {
            type: n.BLOCK,
            meta: { subType: `verse` },
            children: [
              {
                type: n.VERSE_STANZA,
                children: [
                  { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Beep` }] },
                  { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Boop` }] },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });

  test(`footnote poetry followed by more footnote text`, () => {
    const parser = getParser(
      stripIndent(`
Hello world.^
footnote:[Herp derp
\`    Beep
     Boop \`
Hello world.]
    `).trim() + `\n\n`,
    );

    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(2);
    expect(nodes).toMatchObject([
      {
        type: n.TEXT,
        value: `Hello world.`,
      },
      {
        type: n.FOOTNOTE,
        children: [
          { type: n.PARAGRAPH, children: [{ type: n.TEXT, value: `Herp derp` }] },
          {
            type: n.BLOCK,
            meta: { subType: `verse` },
            children: [
              {
                type: n.VERSE_STANZA,
                children: [
                  { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Beep` }] },
                  { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Boop` }] },
                ],
              },
            ],
          },
          { type: n.PARAGRAPH, children: [{ type: n.TEXT, value: `Hello world.` }] },
        ],
      },
    ]);
  });

  test(`footnote poetry with stanzas`, () => {
    const parser = getParser(
      stripIndent(`
Hello world.^
footnote:[Herp derp
\`    Beep
     Boop
     - - - - - -
     Herp
     Derp \`]
    `).trim() + `\n\n`,
    );

    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(2);
    expect(nodes).toMatchObject([
      {
        type: n.TEXT,
        value: `Hello world.`,
      },
      {
        type: n.FOOTNOTE,
        children: [
          { type: n.PARAGRAPH, children: [{ type: n.TEXT, value: `Herp derp` }] },
          {
            type: n.BLOCK,
            meta: { subType: `verse` },
            children: [
              {
                type: n.VERSE_STANZA,
                children: [
                  { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Beep` }] },
                  { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Boop` }] },
                ],
              },
              {
                type: n.VERSE_STANZA,
                children: [
                  { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Herp` }] },
                  { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Derp` }] },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });
});
