import { TOKEN as t } from '../types';
import Parser from '../Parser';
import Context from '../Context';

export default class ContextParser {
  private context;

  public constructor(private p: Parser) {
    this.context = new Context();
  }

  public parse(): Context | null {
    if (!this.p.currentIs(t.LEFT_BRACKET) || this.p.current.column.start !== 1) {
      return null;
    }

    this.p.consume(t.LEFT_BRACKET);
    this.parseType();
    this.parseId();

    let guard = this.p.makeWhileGuard(`ContextParser.parse(<classes>)`, 10);
    while (guard() && this.p.currentIs(t.DOT)) {
      this.p.consume(t.DOT);
      this.context.classList.push(this.parseIdentifier());
    }

    return this.context;
  }

  private parseId(): void {
    if (this.p.currentIs(t.HASH)) {
      this.p.consume(t.HASH);
      this.context.id = this.parseIdentifier();
    }
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
        this.p.error(`unexpected context type: ${literal}`);
    }
  }

  private parseIdentifier(): string {
    let identifier = ``;
    const guard = this.p.makeWhileGuard(`ContextParser.parseIdentifier()`, 10);
    while (guard() && !this.p.currentOneOf(t.DOT, t.WHITESPACE, t.RIGHT_BRACKET)) {
      identifier += this.p.current.literal;
      this.p.consume();
    }
    return identifier;
  }
}
