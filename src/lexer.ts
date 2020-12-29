interface LexerInput {
  adoc: string;
  filename?: string;
}

export const TOKEN = {
  TEXT: `TEXT`,
  WHITESPACE: `WHITESPACE`,
  SINGLE_UNDERSCORE: `SINGLE_UNDERSCORE`,
  DOUBLE_UNDERSCORE: `DOUBLE_UNDERSCORE`,
  LEFT_DOUBLE_CURLY: `LEFT_DOUBLE_CURLY`,
  RIGHT_DOUBLE_CURLY: `RIGHT_DOUBLE_CURLY`,
  LEFT_BRACE: `LEFT_BRACE`,
  RIGHT_BRACE: `RIGHT_BRACE`,
  QUOTE_BLOCK_DELIMITER: `QUOTE_BLOCK_DELIMITER`,
  EQUALS: `EQUALS`,
  COMMA: `COMMA`,
  DOT: `DOT`,
  EOL: `EOL`,
  EOF: `EOF`,
  ILLEGAL: `ILLEGAL`,
} as const;

export type TokenType = keyof typeof TOKEN;

export type Token = {
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
      if (current.type === TOKEN.EOF) {
        return tokens;
      }
    }
  }

  public nextToken(): Token {
    const line = this.currentLine();
    if (!line) {
      return this.makeToken(TOKEN.EOF, null);
    }

    const char = line.content[line.charIdx];
    if (char === undefined) {
      this.line = null;
      return this.nextToken();
    }

    if (isTextChar(char)) {
      const textToken = this.makeToken(TOKEN.TEXT, line, false);
      while (isTextChar(this.peekChar())) {
        const nextChar = this.requireNextChar();
        textToken.literal += nextChar;
        textToken.column.end += 1;
      }
      line.charIdx++;
      return textToken;
    }

    let tok: Token;
    switch (char) {
      case `\n`:
        return this.makeToken(TOKEN.EOL, line);
      case ',':
        return this.makeToken(TOKEN.COMMA, line);
      case '.':
        return this.makeToken(TOKEN.DOT, line);
      case '[':
        return this.makeToken(TOKEN.LEFT_BRACE, line);
      case ']':
        return this.makeToken(TOKEN.RIGHT_BRACE, line);
      case ' ':
        return this.makeGreedyToken(TOKEN.WHITESPACE, line);
      case '=':
        return this.makeGreedyToken(TOKEN.EQUALS, line);
      case '_':
        if (this.peekChar() !== '_') {
          return this.makeToken(TOKEN.SINGLE_UNDERSCORE, line);
        } else {
          tok = this.makeToken(TOKEN.QUOTE_BLOCK_DELIMITER, line, false);
          while (this.peekChar() === '_') {
            tok.literal += this.requireNextChar();
            tok.column.end++;
          }
          line.charIdx++;
          if (tok.literal.length === 2) {
            tok.type = TOKEN.DOUBLE_UNDERSCORE;
          } else if (tok.literal.length !== 4) {
            tok.type = TOKEN.ILLEGAL;
          }
          return tok;
        }
      case `\``: {
        if (this.peekChar() === `"`) {
          tok = this.makeToken(TOKEN.RIGHT_DOUBLE_CURLY, line, false);
          return this.requireAppendChar(tok, line);
        }
      }
      case `"`: {
        if (this.peekChar() === `\``) {
          tok = this.makeToken(TOKEN.LEFT_DOUBLE_CURLY, line, false);
          return this.requireAppendChar(tok, line);
        }
      }
    }

    throw new Error(`character "${char}" not implemented`);
  }

  private requireAppendChar(tok: Token, line: Line): Token {
    tok.literal += this.requireNextChar();
    tok.column.end++;
    line.charIdx++;
    return tok;
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

  private makeToken(type: TokenType, line: Line | null, advanceChar = true): Token {
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
    if (advanceChar && line) {
      line.charIdx++;
    }
    return token;
  }

  private makeGreedyToken(type: TokenType, line: Line): Token {
    const tok = this.makeToken(type, line, false);
    while (tok.literal[0] && this.peekChar() === tok.literal[0]) {
      tok.literal += this.requireNextChar();
      tok.column.end++;
    }
    line.charIdx++;
    return tok;
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
  if (ascii >= 48 && ascii < 58) {
    return true;
  }

  if (['-', ':'].includes(char)) {
    return true;
  }

  return isLetter(char);
}
