import { Token } from './types';

export default class ParserError extends Error {
  constructor(
    message: string,
    protected line: string,
    protected location: string,
    protected token: Token,
  ) {
    super(message);
    this.name = `ParserError`;
  }

  public get codeFrame(): string {
    const lineNum = String(this.token.line);
    const col = this.token.column;
    return [
      `Parse error: ${this.message}\nat ${this.location}`,
      `\n\n${c(`magenta`)}${lineNum.padStart(5, ` `)}${c(`reset`)}`,
      `${c(`gray`)}: ${this.line.trimEnd()}${c(`reset`)}\n`,
      `${` `.padStart(col.start + 6, ` `)}`,
      `${c(`red`)}${`^`.padStart(col.end - col.start + 1, `^`)}-- ERR!${c(`reset`)}\n`,
    ].join(``);
  }

  public get filename(): string {
    return this.token.filename ?? `[no-file]`;
  }

  public get lineNumber(): number {
    return this.token.line;
  }

  /**
   * @deprecated Use columnStart and columnEnd instead
   */
  public get column(): number {
    return this.token.column.start;
  }

  public get columnStart(): number {
    return this.token.column.start;
  }

  public get columnEnd(): number {
    return this.token.column.end;
  }
}

function isBrowser(): boolean {
  return typeof window !== `undefined` && typeof window.document !== `undefined`;
}

function c(type: 'magenta' | 'gray' | 'red' | 'reset'): string {
  if (isBrowser()) {
    return ``;
  }
  switch (type) {
    case `reset`:
      return `\x1b[0m`;
    case `magenta`:
      return `\x1b[35m`;
    case `gray`:
      return `\x1b[2m`;
    case `red`:
      return `\x1b[31m`;
  }
}
