import { NODE as n } from '../types';
import BlockParser from '../parsers/BlockParser';
import { getChapter, getParser } from './helpers';
import BlockNode from '../nodes/BlockNode';
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
});

function getParsedBlock(adoc: string): BlockNode {
  const parser = getParser(stripIndent(adoc).trim() + `\n`);
  const blockParser = new BlockParser(parser);
  return blockParser.parse(getChapter());
}
