import stripIndent from 'strip-indent';
import HeadingParser from '../parsers/HeadingParser';
import { AstNode, NODE as n } from '../types';
import { getParser, getBlock, assertAllNodesHaveTokens } from './helpers';

describe(`HeadingParse.parse()`, () => {
  it(`handles simple heading`, () => {
    const heading = getParsedHeading(`== Chapter 1`);
    assertAllNodesHaveTokens(heading);
    expect(heading.toJSON()).toMatchObject({
      type: n.HEADING,
      meta: { level: 2 },
      children: [{ type: n.TEXT, value: `Chapter 1` }],
    });
  });

  it(`handles old-style heading`, () => {
    const heading = getParsedHeading(`== Old / Style / Heading`);
    assertAllNodesHaveTokens(heading);
    expect(heading.toJSON()).toMatchObject({
      type: n.HEADING,
      meta: { level: 2 },
      children: [
        {
          type: n.OLD_STYLE_LINE,
          meta: { level: 1 },
          children: [{ type: n.TEXT, value: `Old` }],
        },
        {
          type: n.OLD_STYLE_LINE,
          meta: { level: 2 },
          children: [{ type: n.TEXT, value: `Style` }],
        },
        {
          type: n.OLD_STYLE_LINE,
          meta: { level: 3 },
          children: [{ type: n.TEXT, value: `Heading` }],
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
