import Context from '../Context';
import ContextParser from '../parsers/ContextParser';
import { getParser } from './helpers';

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
