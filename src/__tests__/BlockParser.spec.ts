import { NODE as n } from '../types';
import BlockParser from '../parsers/BlockParser';
import { getChapter, getParser } from './helpers';
import ChapterNode from '../nodes/ChapterNode';
import BlockNode from '../nodes/BlockNode';
import stripIndent from 'strip-indent';

describe(`BlockParser.parse()`, () => {
  it(`can parse a simple paragraph`, () => {
    const block = getParsedBlock(`Hello world\n\n`);
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

  xit(`can parse a blockquote`, () => {
    const block = getParsedBlock(`
      [quote, , ]
      ____
      Hello world
      ____
    `);
    expect(block.toJSON()).toMatchObject({
      type: n.BLOCK,
      blockType: `QUOTE`,
      children: [
        {
          type: n.PARAGRAPH,
          children: [{ type: n.TEXT, value: 'Hello world' }],
        },
      ],
    });
  });
});

function getParsedBlock(adoc: string): BlockNode {
  const parser = getParser(stripIndent(adoc).trim() + `\n\n`);
  const blockParser = new BlockParser(parser);
  return blockParser.parse(getChapter());
}
