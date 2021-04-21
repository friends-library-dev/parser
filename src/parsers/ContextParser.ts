import { TOKEN as t, Token, TokenType } from '../types';
import Parser from '../Parser';
import Context from '../Context';

export default class ContextParser {
  private context;

  public constructor(private p: Parser) {
    this.context = new Context();
  }

  public parse(): Context | undefined {
    if (!this.p.currentIs(t.LEFT_BRACKET) || this.p.current.column.start !== 1) {
      return undefined;
    }

    // reject lines starting with inline-context, like `[.book-title]#Apology# foo`
    if (this.isInlineContext()) {
      return undefined;
    }

    this.context.startToken = this.p.consume(t.LEFT_BRACKET);
    this.parseShortTitle(DONT_REQUIRE);
    this.parseType();
    this.parseId();

    const guard = this.p.makeWhileGuard(`ContextParser.parse(<classes>)`, 10);
    while (guard() && this.p.currentIs(t.DOT)) {
      this.p.consume(t.DOT);
      this.context.classList.push(this.parseIdentifier());
    }

    if (this.p.currentIs(t.COMMA)) {
      this.p.consume(t.COMMA);
      this.p.consume(t.WHITESPACE);
      this.context.type === `quote` || this.context.type === `epigraph`
        ? this.parseQuoteMeta()
        : this.parseShortTitle(REQUIRE);
    }

    this.p.consume(t.RIGHT_BRACKET);
    this.context.endToken = this.p.consume(t.EOL);
    return this.context;
  }

  private parseQuoteMeta(): void {
    if (this.p.currentOneOf(t.TEXT, t.STRAIGHT_DOUBLE_QUOTE)) {
      this.context.quoteAttribution = this.getAttributeTokens();
    }

    this.p.consume(t.COMMA);

    // if we see `]` here it means it's an empty attribution, e.g. `[quote, ,]
    if (this.p.currentIs(t.RIGHT_BRACKET)) {
      return;
    }

    this.p.consume(t.WHITESPACE);
    this.context.quoteSource = this.getAttributeTokens();
  }

  private parseShortTitle(require = true): void {
    if (!this.p.peekTokens([t.TEXT, `short`], [t.EQUALS, `=`], t.STRAIGHT_DOUBLE_QUOTE)) {
      if (require) {
        this.p.throwError(`expected short title (e.g. short="<title>")`);
      }
      return;
    }
    this.p.consume(t.TEXT);
    this.p.consume(t.EQUALS);
    this.context.shortTitle = this.getAttributeTokens();
  }

  private getAttributeTokens(): Token[] {
    const tokens: Token[] = [];

    let stopTokenType: TokenType = t.RIGHT_BRACKET;
    if (this.p.currentIs(t.STRAIGHT_DOUBLE_QUOTE)) {
      stopTokenType = t.STRAIGHT_DOUBLE_QUOTE;
      this.p.consume(t.STRAIGHT_DOUBLE_QUOTE);
    }

    const stop: TokenType[] = [stopTokenType];
    if (stopTokenType !== t.STRAIGHT_DOUBLE_QUOTE) {
      stop.push(t.COMMA);
    }

    const guard = this.p.makeWhileGuard(`ContextParser.getAttributeTokens()`, 100);
    while (guard() && !this.p.currentOneOf(...stop)) {
      // currently not supporting escaped double-quote: e.g. `[quote, , "Hello \"world\""]
      tokens.push(this.p.current);
      this.p.consume();
    }

    if (stopTokenType === t.STRAIGHT_DOUBLE_QUOTE) {
      this.p.consume(t.STRAIGHT_DOUBLE_QUOTE);
    }

    return tokens;
  }

  private parseId(): void {
    if (!this.p.currentIs(t.HASH)) {
      return;
    }
    this.p.consume(t.HASH);
    this.context.id = this.parseIdentifier();
    this.p.document.idChapterLocations[this.context.id] = this.p.parsingChapterNum;
  }

  private parseType(): void {
    if (!this.p.currentIs(t.TEXT)) {
      return;
    }

    const literal = this.p.current.literal;
    this.p.consume(t.TEXT);

    switch (literal) {
      case `quote`:
        if (this.p.peekTokens(t.DOT, [t.TEXT, `epigraph`])) {
          this.p.consume(t.DOT);
          this.p.consume(t.TEXT);
          this.context.type = `epigraph`;
        } else {
          this.context.type = `quote`;
        }
        return;
      case `discrete`:
        this.context.type = `discrete`;
        return;
      case `verse`:
        this.context.type = `verse`;
        return;
      default:
        this.p.throwError(`unexpected context type: ${literal}`);
    }
  }

  private parseIdentifier(): string {
    let identifier = ``;
    const guard = this.p.makeWhileGuard(`ContextParser.parseIdentifier()`, 10);
    while (
      guard() &&
      !this.p.currentOneOf(t.DOT, t.WHITESPACE, t.RIGHT_BRACKET, t.COMMA)
    ) {
      identifier += this.p.current.literal;
      this.p.consume();
    }
    return identifier;
  }

  private isInlineContext(): boolean {
    let distance = 1;
    let current = this.p.lookAhead(distance);
    const guard = this.p.makeWhileGuard(`ContextParser.isInlineContext()`);
    while (
      guard() &&
      !this.p.tokenIs(current, t.RIGHT_BRACKET) &&
      !this.p.tokenIs(current, t.EOX)
    ) {
      current = this.p.lookAhead(++distance);
    }
    return this.p.lookAhead(distance + 1).type === t.HASH;
  }
}

const REQUIRE = true;
const DONT_REQUIRE = false;
