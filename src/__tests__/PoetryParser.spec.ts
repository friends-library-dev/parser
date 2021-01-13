import stripIndent from 'strip-indent';
import Context from '../Context';
import PoetryParser from '../parsers/PoetryParser';
import { AstNode, NODE as n } from '../types';
import { getParser, getBlock, assertAllNodesHaveTokens } from './helpers';

// TODO... rename StanzaParser?
describe('PoetryParser.parse()', () => {
  it(`wraps lines in line nodes, and groups lines into stanzas`, () => {
    const poetry = getParsedPoetry(`
       Hello Mama
       Hello Papa
     `);
    poetry.forEach(assertAllNodesHaveTokens);
    expect(poetry.map((s) => s.toJSON())).toMatchObject([
      {
        type: n.VERSE_STANZA,
        children: [
          { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Hello Mama` }] },
          { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Hello Papa` }] },
        ],
      },
    ]);
  });

  it(`can handle multiple stanzas`, () => {
    const poetry = getParsedPoetry(`
       Hello Mama
       Hello Papa

       Hello world
       Goodbye world
     `);
    poetry.forEach(assertAllNodesHaveTokens);
    expect(poetry.map((s) => s.toJSON())).toMatchObject([
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
          { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Hello world` }] },
          { type: n.VERSE_LINE, children: [{ type: n.TEXT, value: `Goodbye world` }] },
        ],
      },
    ]);
  });
});

function getParsedPoetry(adoc: string): AstNode[] {
  const parser = getParser(stripIndent(adoc).trim() + `\n`);
  const poetryParser = new PoetryParser(parser);
  const context = new Context();
  context.type = `verse`;
  const block = getBlock();
  block.context = context;
  return poetryParser.parse(block);
}
