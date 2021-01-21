import { Token, Context as ContextInterface } from './types';

export default class Context implements ContextInterface {
  public classList: string[] = [];
  public type?: 'quote' | 'verse' | 'epigraph' | 'discrete';
  public id?: string;
  public quoteAttribution?: Token[];
  public quoteSource?: Token[];
  public shortTitle?: Token[];
  protected _startToken: Token | undefined;
  protected _endToken: Token | undefined;

  public set startToken(token: Token) {
    this._startToken = token;
  }

  public get startToken(): Token {
    if (!this._startToken) {
      throw new Error(`Unexpected missing Context.startToken`);
    }
    return this._startToken;
  }

  public set endToken(token: Token) {
    this._endToken = token;
  }

  public get endToken(): Token {
    if (!this._endToken) {
      throw new Error(`Unexpected missing Context.endToken`);
    }
    return this._endToken;
  }

  public toJSON(withTokens?: true): Record<string, unknown> {
    return {
      classList: this.classList,
      ...(this.type ? { type: this.type } : {}),
      ...(this.id ? { id: this.id } : {}),
      ...(this.quoteAttribution ? { quoteAttribution: this.quoteAttribution } : {}),
      ...(this.quoteSource ? { quoteSource: this.quoteSource } : {}),
      ...(this.shortTitle ? { shortTitle: this.shortTitle } : {}),
      ...(withTokens ? { startToken: this.startToken, endToken: this.endToken } : {}),
    };
  }

  public print(withTokens?: true): void {
    console.log(JSON.stringify(this.toJSON(withTokens), null, 2));
  }
}
