import stripIndent from 'strip-indent';
import { TOKEN as t, NODE as n } from '../types';
import { getPara, getParser, assertAllNodesHaveTokens, T } from './helpers';

describe(`Parser.parseUntil() using parselets`, () => {
  it(`can handle sameline footnotes`, () => {
    const parser = getParser(`Hello worldfootnote:[Hello]\n`);
    const nodes = parser.parseUntil(getPara(), t.EOL);
    expect(nodes).toHaveLength(2);
    expect(nodes).toMatchObject([
      T.text(`Hello world`),
      { type: n.FOOTNOTE, children: [T.paragraph(`Hello`)] },
    ]);
  });

  it(`can handle footnotes not ending at EOL`, () => {
    const parser = getParser(`Hello world^\nfootnote:[Hello]? For\n\n`);
    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    expect(nodes).toHaveLength(3);
    expect(nodes).toMatchObject([
      T.text(`Hello world`),
      { type: n.FOOTNOTE, children: [T.paragraph(`Hello`)] },
      T.text(`? For`),
    ]);
  });

  it(`can handle footnotes with book title`, () => {
    const parser = getParser(`Hello world^\nfootnote:[[.book-title]#Apology# Hello]\n\n`);
    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    expect(nodes).toHaveLength(2);
    expect(nodes).toMatchObject([
      T.text(`Hello world`),
      {
        type: n.FOOTNOTE,
        children: [
          {
            type: n.PARAGRAPH,
            children: [
              {
                type: n.INLINE,
                context: { classList: [`book-title`] },
                children: [T.text(`Apology`)],
              },
              T.text(` Hello`),
            ],
          },
        ],
      },
    ]);
  });

  it(`can handle footnotes with underline`, () => {
    const parser = getParser(
      `Hello world^\nfootnote:[[.underline]#Underlined# Hello]\n\n`,
    );
    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    expect(nodes).toHaveLength(2);
    expect(nodes).toMatchObject([
      T.text(`Hello world`),
      {
        type: n.FOOTNOTE,
        children: [
          {
            type: n.PARAGRAPH,
            children: [
              {
                type: n.INLINE,
                context: { classList: [`underline`] },
                children: [T.text(`Underlined`)],
              },
              T.text(` Hello`),
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
      T.text(`Hello world`),
      { type: n.FOOTNOTE, children: [T.paragraph(`[Hello]`)] },
      T.text(`? For`),
    ]);
  });

  it(`can handle caret-started footnotes`, () => {
    const parser = getParser(`Hello world.^\nfootnote:[Hello]\n\n`);
    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    expect(nodes).toHaveLength(2);
    expect(nodes).toMatchObject([
      T.text(`Hello world.`),
      { type: n.FOOTNOTE, children: [T.paragraph(`Hello`)] },
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
      T.text(`Hello world.`),
      {
        type: n.FOOTNOTE,
        children: [T.paragraph(`Hello.`), T.paragraph(`Goodbye.`)],
      },
    ]);
  });

  test(`book title followed by footnote`, () => {
    const adoc =
      `
Hello world
[.book-title]#The Fanatic History,#^
footnote:[Es decir, _Historia de los Fanaticos._]
goodbye world.
    `.trim() + `\n\n`;
    const parser = getParser(adoc);
    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    expect(nodes).toMatchObject([
      T.text(`Hello world `),
      {
        type: n.INLINE,
        ...T.context([`book-title`]),
        children: [T.text(`The Fanatic History,`)],
      },
      {
        type: n.FOOTNOTE,
        children: [
          {
            type: n.PARAGRAPH,
            children: [
              T.text(`Es decir, `),
              { type: n.EMPHASIS, children: [T.text(`Historia de los Fanaticos.`)] },
            ],
          },
        ],
      },
      T.text(` goodbye world.`),
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
      T.text(`Hello world.`),
      {
        type: n.FOOTNOTE,
        children: [
          T.paragraph(`Herp derp`),
          {
            type: n.BLOCK,
            meta: { subType: `verse` },
            children: [
              {
                type: n.VERSE_STANZA,
                children: [
                  { type: n.VERSE_LINE, children: [T.text(`Beep`)] },
                  { type: n.VERSE_LINE, children: [T.text(`Boop`)] },
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
      T.text(`Hello world.`),
      {
        type: n.FOOTNOTE,
        children: [
          T.paragraph(`Herp derp`),
          {
            type: n.BLOCK,
            meta: { subType: `verse` },
            children: [
              {
                type: n.VERSE_STANZA,
                children: [
                  { type: n.VERSE_LINE, children: [T.text(`Beep`)] },
                  { type: n.VERSE_LINE, children: [T.text(`Boop`)] },
                ],
              },
            ],
          },
          T.paragraph(`Hello world.`),
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
      T.text(`Hello world.`),
      {
        type: n.FOOTNOTE,
        children: [
          T.paragraph(`Herp derp`),
          {
            type: n.BLOCK,
            meta: { subType: `verse` },
            children: [
              {
                type: n.VERSE_STANZA,
                children: [
                  { type: n.VERSE_LINE, children: [T.text(`Beep`)] },
                  { type: n.VERSE_LINE, children: [T.text(`Boop`)] },
                ],
              },
              {
                type: n.VERSE_STANZA,
                children: [
                  { type: n.VERSE_LINE, children: [T.text(`Herp`)] },
                  { type: n.VERSE_LINE, children: [T.text(`Derp`)] },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });

  test(`footnote poetry between paragraph splits`, () => {
    const parser = getParser(
      stripIndent(`
Hello world.^
footnote:[Herp derp
{footnote-paragraph-split}
\`    Beep
     Boop
     - - - - - -
     Herp
     Derp \`
{footnote-paragraph-split}
Hello Mama.]
    `).trim() + `\n\n`,
    );

    const nodes = parser.parseUntil(getPara(), t.DOUBLE_EOL);
    nodes.forEach(assertAllNodesHaveTokens);
    expect(nodes).toHaveLength(2);
    expect(nodes).toMatchObject([
      T.text(`Hello world.`),
      {
        type: n.FOOTNOTE,
        children: [
          T.paragraph(`Herp derp`),
          {
            type: n.BLOCK,
            meta: { subType: `verse` },
            children: [
              {
                type: n.VERSE_STANZA,
                children: [
                  { type: n.VERSE_LINE, children: [T.text(`Beep`)] },
                  { type: n.VERSE_LINE, children: [T.text(`Boop`)] },
                ],
              },
              {
                type: n.VERSE_STANZA,
                children: [
                  { type: n.VERSE_LINE, children: [T.text(`Herp`)] },
                  { type: n.VERSE_LINE, children: [T.text(`Derp`)] },
                ],
              },
            ],
          },
          T.paragraph(`Hello Mama.`),
        ],
      },
    ]);
  });
});
