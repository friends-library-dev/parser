import stripIndent from 'strip-indent';
import Parser from '../Parser';
import Lexer from '../lexer';
import { NODE as n } from '../types';

describe(`Parser.parse()`, () => {
  it(`can parse a thing`, () => {
    const adoc = stripIndent(`
      == Chapter 1

      Hello world.
    `);

    const lexer = new Lexer({ adoc });
    const parser = new Parser(lexer);
    const document = parser.parse();

    expect(document.toJSON()).toMatchObject({
      type: n.DOCUMENT,
      children: [
        {
          type: n.CHAPTER,
          children: [
            {
              type: n.HEADING,
              level: 2,
              children: [{ type: n.TEXT, value: `Chapter 1` }],
            },
            {
              type: n.PARAGRAPH,
              children: [{ type: n.TEXT, value: `Hello world.` }],
            },
          ],
        },
      ],
    });
  });
});

// epigraphs
// classname above section title
// footnotes
