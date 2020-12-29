interface LexerInput {
  adoc: string;
  filename?: string;
}

const Token = {
  TEXT: `TEXT`,
  WHITESPACE: `WHITESPACE`,
  SINGLE_UNDERSCORE: `SINGLE_UNDERSCORE`,
  EOL: `EOL`,
  EOF: `EOF`,
} as const;

type TokenType = keyof typeof Token;

type Token = {
  type: TokenType;
  literal: string;
  filename?: string;
  line: number;
  column: {
    start: number;
    end: number;
  };
};

interface Line {
  content: string;
  number: number;
  charIdx: number;
  filename?: string;
}

export default class Lexer {
  public inputs: LexerInput[] = [];
  public inputIdx = -1;
  public line: null | Line = null;
  public lines: Line[] = [];
  public lastToken?: Token;

  public constructor(...inputs: LexerInput[]) {
    this.inputs = inputs;
  }

  public tokens(): Token[] {
    const tokens: Token[] = [];
    while (true) {
      const current = this.nextToken();
      tokens.push(current);
      if (current.type === Token.EOF) {
        return tokens;
      }
    }
  }

  public nextToken(): Token {
    const line = this.currentLine();
    if (!line) {
      return this.makeToken(Token.EOF, null);
    }

    const char = line.content[line.charIdx];
    if (char === undefined) {
      this.line = null;
      return this.nextToken();
    }

    if (isTextChar(char)) {
      const textToken = this.makeToken(Token.TEXT, line);
      while (isTextChar(this.peekChar())) {
        const nextChar = this.requireNextChar();
        textToken.literal += nextChar;
        textToken.column.end += 1;
      }

      line.charIdx++;
      return textToken;
    }

    switch (char) {
      case `\n`: {
        const eolToken = this.makeToken(Token.EOL, line);
        line.charIdx++;
        return eolToken;
      }
      case '_': {
        const underscoreToken = this.makeToken(Token.SINGLE_UNDERSCORE, line);
        line.charIdx++;
        return underscoreToken;
      }
      case ' ': {
        const wsToken = this.makeToken(Token.WHITESPACE, line);
        while (this.peekChar() === ' ') {
          wsToken.literal += this.requireNextChar();
          wsToken.column.end++;
        }
        line.charIdx++;
        return wsToken;
      }
    }

    throw new Error('not implemented');
  }

  private requireNextChar(): string {
    const line = this.line;
    if (line === null) {
      throw new Error(`Expected a next char`);
    }
    line.charIdx += 1;
    const nextChar = line.content[line.charIdx];
    if (nextChar === undefined) {
      throw new Error(`Expected a next char`);
    }

    return nextChar;
  }

  private makeToken(type: TokenType, line: Line | null): Token {
    let column = { start: 1, end: 1 };
    if (line) {
      column = { start: line.charIdx + 1, end: line.charIdx + 1 };
    } else if (this.lastToken) {
      column = { start: this.lastToken.column.end, end: this.lastToken.column.end };
    }

    const token: Token = {
      type,
      literal: line?.content[line.charIdx] ?? ``,
      filename: line?.filename ?? this.lastToken?.filename,
      line: line?.number ?? this.lastToken?.line ?? 1,
      column,
    };
    this.lastToken = token;
    return token;
  }

  private peekChar(): string | null {
    const line = this.line;
    if (line === null) {
      return null;
    }
    return line.content[line.charIdx + 1] ?? null;
  }

  private currentLine(): Line | null {
    if (this.line === null) {
      return this.nextLine();
    }

    return this.line;
  }

  private nextLine(): Line | null {
    if (this.lines.length) {
      const line = this.lines.shift() as Line;
      this.line = line;
      return line;
    }

    this.inputIdx++;
    const nextInput = this.inputs[this.inputIdx];
    if (this.inputIdx >= this.inputs.length || !nextInput) {
      return null;
    }

    this.lines = nextInput.adoc.split(/\n/g).map((line, lineIdx) => ({
      charIdx: 0,
      content: `${line}\n`,
      number: lineIdx + 1,
      filename: nextInput.filename,
    }));

    if (nextInput.adoc.endsWith(`\n`)) {
      // throw away false empty line created by splitting on `\n`
      this.lines.pop();
    }

    return this.nextLine();
  }
}

function isLetter(char: string | null): boolean {
  if (null === char || char.length === 0) {
    return false;
  }

  // fast, non-regex that will work for most letters
  const ascii = char.charCodeAt(0);
  if (ascii >= 65 && ascii < 91) {
    return true;
  }

  return char.match(/^[a-z]$/i) !== null;
}

function isTextChar(char: string | null): boolean {
  if (null === char || char.length === 0) {
    return false;
  }

  // number?
  const ascii = char.charCodeAt(0);
  if (ascii >= 48 && ascii < 72) {
    return true;
  }

  if (['-'].includes(char)) {
    return true;
  }

  return isLetter(char);
}
