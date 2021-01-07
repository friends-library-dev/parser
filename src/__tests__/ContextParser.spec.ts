import Context from '../Context';
import ContextParser from '../parsers/ContextParser';
import { getParser, simplifyToken } from './helpers';
import { TOKEN as t } from '../types';

describe(`ContextParser.parse()`, () => {
  test(`non context tokens returns null`, () => {
    const context = getContext(`Hello world`);
    expect(context).toBeNull();
  });

  test(`basic class added to context`, () => {
    const context = getContext(`[.offset]`);
    expect(context?.classList).toMatchObject([`offset`]);
  });

  test(`can parse more complex identifiers`, () => {
    const context = getContext(`[.style--blurb]`);
    expect(context?.classList).toMatchObject([`style--blurb`]);
  });

  test(`can parse multiple classes`, () => {
    const context = getContext(`[.offset.emphasized]`);
    expect(context?.classList).toMatchObject([`offset`, `emphasized`]);
  });

  test(`can parse type`, () => {
    const context = getContext(`[quote.scripture]`);
    expect(context?.classList).toMatchObject([`scripture`]);
    expect(context?.type).toBe(`quote`);
  });

  test(`can parse epigraph`, () => {
    const context = getContext(`[quote.epigraph]`);
    expect(context?.classList).toHaveLength(0);
    expect(context?.type).toBe(`epigraph`);
  });

  test(`unexpected type causes parse error`, () => {
    expect(() => getContext(`[invalid]`)).toThrow(/unexpected context type/i);
  });

  test(`parses id`, () => {
    const context = getContext(`[#ch1.style--blurb]`);
    expect(context?.classList).toMatchObject([`style--blurb`]);
    expect(context?.id).toBe(`ch1`);
  });

  test(`parses empty quote`, () => {
    const context = getContext(`[quote, ,]`);
    expect(context?.type).toBe(`quote`);
    expect(context?.quoteSource).toBeUndefined();
  });

  test(`parses quote with scripture source`, () => {
    const context = getContext(`[quote.scripture, , John 1:4-5]`);
    expect(context?.type).toBe(`quote`);
    expect(context?.quoteSource?.map(simplifyToken)).toMatchObject([
      { type: t.TEXT, literal: `John` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `1:4-5` },
    ]);
  });

  test(`parses complex quoted attribution`, () => {
    const context = getContext(`[quote.scripture, , "Apology, Prop. 7, Sec. 3"]`);
    expect(context?.type).toBe(`quote`);
    expect(context?.quoteSource?.map(simplifyToken)).toMatchObject([
      { type: t.TEXT, literal: `Apology` },
      { type: t.COMMA, literal: `,` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `Prop` },
      { type: t.DOT, literal: `.` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `7` },
      { type: t.COMMA, literal: `,` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `Sec` },
      { type: t.DOT, literal: `.` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `3` },
    ]);
  });

  test(`parses short title`, () => {
    const context = getContext(`[#ch1, short="Hello world"]`);
    expect(context?.id).toBe(`ch1`);
    expect(context?.shortTitle?.map(simplifyToken)).toMatchObject([
      { type: t.TEXT, literal: `Hello` },
      { type: t.WHITESPACE, literal: ` ` },
      { type: t.TEXT, literal: `world` },
    ]);
  });

  // *** [quote, attribution, title] ***
  // [quote.scripture, ,]
  // [quote.scripture, , John 1:4-5]
  // [quote, , "Apology, Prop. 7, Sec. 3"] straight quotes!

  // short title
  // [#ch1, short="Short title"]
});

function getContext(adoc: string): Context | null {
  const parser = getParser(adoc);
  const contextParser = new ContextParser(parser);
  return contextParser.parse();
}
