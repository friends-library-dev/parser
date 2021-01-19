import stripIndent from 'strip-indent';
import { NODE as n } from '../types';
import DescriptionListParser from '../parsers/DescriptionListParser';
import { assertAllNodesHaveTokens, getBlock, getParser } from './helpers';

describe('DescriptionListParser.peekStart()', () => {
  it('returns false for upcoming line without double-colon', () => {
    const dlParser = getDlParser(`Hello world`);
    expect(dlParser.peekStart()).toBe(false);
  });

  it('returns true for upcoming line same-line description list', () => {
    const dlParser = getDlParser(`Hello:: world`);
    expect(dlParser.peekStart()).toBe(true);
  });

  it('returns true for upcoming line multi-line description list', () => {
    const dlParser = getDlParser(`Hello::\nworld`);
    expect(dlParser.peekStart()).toBe(true);
  });
});

describe('DescriptionListParser.parse()', () => {
  it('can parse a list of one pair', () => {
    const dlParser = getDlParser(`Hello:: world`);
    const list = dlParser.parse(getBlock());
    assertAllNodesHaveTokens(list);
    expect(list.toJSON()).toMatchObject({
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
      ],
    });
  });

  it('can parse a list of multiple pairs', () => {
    const dlParser = getDlParser(`Hello::\nworld\n\nHerp:: derp`);
    const list = dlParser.parse(getBlock());
    assertAllNodesHaveTokens(list);
    expect(list.toJSON()).toMatchObject({
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
              children: [{ type: n.TEXT, value: `Herp` }],
            },
            {
              type: n.DESCRIPTION_LIST_ITEM_CONTENT,
              children: [{ type: n.TEXT, value: `derp` }],
            },
          ],
        },
      ],
    });
  });
});

function getDlParser(adoc: string): DescriptionListParser {
  const parser = getParser(stripIndent(adoc).trim() + `\n`);
  const dlParser = new DescriptionListParser(parser);
  return dlParser;
}
