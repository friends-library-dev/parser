import stripIndent from 'strip-indent';
import HeadingParser from '../parsers/HeadingParser';
import { AstNode, NODE as n } from '../types';
import { T, getParser, getBlock, assertAllNodesHaveTokens } from './helpers';

describe(`HeadingParse.parse()`, () => {
  it(`handles simple heading`, () => {
    const heading = getParsedHeading(`== Chapter 1`);
    assertAllNodesHaveTokens(heading);
    expect(heading.toJSON()).toMatchObject({
      type: n.HEADING,
      meta: { level: 2 },
      children: [
        {
          type: n.HEADING_SEQUENCE_IDENTIFIER,
          value: `Chapter 1`,
          meta: { data: { number: 1, kind: `Chapter` } },
        },
      ],
    });
  });

  const sequences: Array<[string, string, string, number, string[]]> = [
    [`Chapter 1`, `Chapter 1`, `Chapter`, 1, []],
    [`Sección 999`, `Sección 999`, `Sección`, 999, []],
    [`Capítulo xiii.`, `Capítulo xiii.`, `Capítulo`, 13, []],
    [`Section III: Beep`, `Section III:`, `Section`, 3, [`Beep`]],
    [`Sección I: Boop`, `Sección I:`, `Sección`, 1, [`Boop`]],
  ];

  test.each(sequences)(`"%s" parsed correctly`, (input, seq, kind, number, title) => {
    const heading = getParsedHeading(`== ${input}`);
    assertAllNodesHaveTokens(heading);
    expect(heading.toJSON()).toMatchObject({
      type: n.HEADING,
      meta: { level: 2 },
      children: [
        {
          type: n.HEADING_SEQUENCE_IDENTIFIER,
          value: seq,
          meta: { data: { kind, number } },
        },
        ...(title.length
          ? [
              {
                type: n.HEADING_TITLE,
                children: title.map((t) => ({ type: n.TEXT, value: t })),
              },
            ]
          : []),
      ],
    });
  });

  it(`handles segmented heading`, () => {
    const heading = getParsedHeading(`== Segment 1 / Segment 2 / Segment 3`);
    assertAllNodesHaveTokens(heading);
    expect(heading.toJSON()).toMatchObject({
      type: n.HEADING,
      meta: { level: 2 },
      children: [
        {
          type: n.HEADING_TITLE,
          children: [
            {
              type: n.HEADING_SEGMENT,
              meta: { level: 1 },
              children: [{ type: n.TEXT, value: `Segment 1` }],
            },
            {
              type: n.HEADING_SEGMENT,
              meta: { level: 2 },
              children: [{ type: n.TEXT, value: `Segment 2` }],
            },
            {
              type: n.HEADING_SEGMENT,
              meta: { level: 3 },
              children: [{ type: n.TEXT, value: `Segment 3` }],
            },
          ],
        },
      ],
    });
  });

  it(`handles sequenced + segmented heading`, () => {
    const heading = getParsedHeading(`== Chapter IV: Segment 1 / Segment _2_`);
    assertAllNodesHaveTokens(heading);
    expect(heading.toJSON()).toMatchObject({
      type: n.HEADING,
      meta: { level: 2 },
      children: [
        {
          type: n.HEADING_SEQUENCE_IDENTIFIER,
          value: `Chapter IV:`,
          meta: { data: { number: 4, kind: `Chapter`, roman: `IV` } },
        },
        {
          type: n.HEADING_TITLE,
          children: [
            {
              type: n.HEADING_SEGMENT,
              meta: { level: 1 },
              children: [{ type: n.TEXT, value: `Segment 1` }],
            },
            {
              type: n.HEADING_SEGMENT,
              meta: { level: 2 },
              children: [
                { type: n.TEXT, value: `Segment ` },
                { type: n.EMPHASIS, children: [{ type: n.TEXT, value: `2` }] },
              ],
            },
          ],
        },
      ],
    });
  });

  // don't pull the `Section 1.` out into a sequence identifier like a chapter
  it(`segmented level 3 with parseable sequence identifier, parsed as plain segment`, () => {
    const heading = getParsedHeading(
      `[.old-style]\n=== Section 1. / Our Happy State Before the Fall`,
    );
    assertAllNodesHaveTokens(heading);
    expect(heading.toJSON()).toMatchObject({
      type: n.HEADING,
      meta: { level: 3 },
      children: [
        {
          type: n.HEADING_TITLE,
          children: [
            {
              type: n.HEADING_SEGMENT,
              meta: { level: 1 },
              children: [T.text(`Section 1.`)],
            },
            {
              type: n.HEADING_SEGMENT,
              meta: { level: 2 },
              children: [T.text(`Our Happy State Before the Fall`)],
            },
          ],
        },
      ],
    });
  });
});

function getParsedHeading(adoc: string): AstNode {
  const parser = getParser(stripIndent(adoc).trim() + `\n`);
  const headingParser = new HeadingParser(parser);
  return headingParser.parse(getBlock());
}
