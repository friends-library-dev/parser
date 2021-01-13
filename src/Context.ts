import { Token } from './types';

export default class Context {
  public classList: string[] = [];
  public type?: 'quote' | 'verse' | 'epigraph' | 'discrete';
  public id?: string;
  public quoteAttribution?: Token[];
  public quoteSource?: Token[];
  public shortTitle?: Token[];
  protected _startToken: Token | undefined;
  protected _endToken: Token | undefined;

  public isBlockQuote(): boolean {
    return this.type === `quote` || this.type === `epigraph`;
  }

  public set startToken(token: Token) {
    this._startToken = token;
  }

  public set endToken(token: Token) {
    this._endToken = token;
  }

  public get startToken(): Token {
    if (!this._startToken) {
      throw new Error(`Unexpected missing Context.startToken`);
    }
    return this._startToken;
  }

  public get endToken(): Token {
    if (!this._endToken) {
      throw new Error(`Unexpected missing Context.endToken`);
    }
    return this._endToken;
  }

  public toJSON(): Record<string, unknown> {
    return {
      classList: this.classList,
      ...(this.type ? { type: this.type } : {}),
      ...(this.id ? { id: this.id } : {}),
      ...(this.quoteAttribution ? { quoteAttribution: this.quoteAttribution } : {}),
      ...(this.quoteSource ? { quoteSource: this.quoteSource } : {}),
      ...(this.shortTitle ? { shortTitle: this.shortTitle } : {}),
    };
  }
}
