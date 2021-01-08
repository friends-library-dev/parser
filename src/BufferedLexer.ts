import { Lexer, Token, TOKEN as t } from './types';

export default class BufferedLexer implements Lexer {
  private _tokens: Token[];
  private EOD: Token;

  public constructor(tokens: Token[]) {
    this._tokens = tokens;
    const last = this._tokens[this._tokens.length - 1];
    if (last?.type === t.EOF) {
      this.pushEndToken(last, t.EOD);
    } else if (last?.type !== t.EOD) {
      this.pushEndToken(last, t.EOF);
      this.pushEndToken(last, t.EOD);
    }
    const EOD = this._tokens[this._tokens.length - 1];
    if (!EOD) {
      throw new Error(`Unexpected missing EOD token`);
    }
    this.EOD = EOD;
  }

  public tokens(): Token[] {
    return this._tokens;
  }

  public nextToken(): Token {
    return this._tokens.shift() ?? this.EOD;
  }

  private pushEndToken(last: Token | undefined, type: 'EOF' | 'EOD' | 'EOL'): void {
    this._tokens.push({
      type,
      literal: ``,
      line: last?.line ?? 1,
      filename: last?.filename,
      column: last?.column ?? { start: 1, end: 1 },
    });
  }
}
