interface LexerInput {
  adoc: string;
  filename?: string;
}

export const TOKEN = {
  TEXT: `TEXT`,
  ASTERISK: `ASTERISK`,
  TRIPLE_ASTERISK: `TRIPLE_ASTERISK`,
  ASTERISM: `ASTERISM`,
  DOUBLE_COLON: `DOUBLE_COLON`,
  FORWARD_SLASH: `FORWARD_SLASH`,
  TRIPLE_PLUS: `TRIPLE_PLUS`,
  WHITESPACE: `WHITESPACE`,
  DOUBLE_DASH: `DOUBLE_DASH`,
  SINGLE_UNDERSCORE: `SINGLE_UNDERSCORE`,
  DOUBLE_UNDERSCORE: `DOUBLE_UNDERSCORE`,
  LEFT_SINGLE_CURLY: `LEFT_SINGLE_CURLY`,
  RIGHT_SINGLE_CURLY: `RIGHT_SINGLE_CURLY`,
  LEFT_DOUBLE_CURLY: `LEFT_DOUBLE_CURLY`,
  RIGHT_DOUBLE_CURLY: `RIGHT_DOUBLE_CURLY`,
  LEFT_BRACE: `LEFT_BRACE`,
  RIGHT_BRACE: `RIGHT_BRACE`,
  QUOTE_BLOCK_DELIMITER: `QUOTE_BLOCK_DELIMITER`,
  FOOTNOTE_PREFIX: `FOOTNOTE_PREFIX`,
  FOOTNOTE_STANZA: `FOOTNOTE_STANZA`,
  EQUALS: `EQUALS`,
  COMMA: `COMMA`,
  CARET: `CARET`,
  BACKTICK: `BACKTICK`,
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
      case '/':
        return this.makeToken(TOKEN.FORWARD_SLASH, line);
      case '^':
        return this.makeToken(TOKEN.CARET, line);
      case ' ':
        return this.makeGreedyToken(TOKEN.WHITESPACE, line);
      case '-':
        if (line.content.substring(line.charIdx, line.charIdx + 11) === `- - - - - -`) {
          tok = this.makeToken(TOKEN.FOOTNOTE_STANZA, line);
          tok.literal = '- - - - - -';
          tok.column.end += 10;
          line.charIdx += 10;
          return tok;
        }
        return this.makeGreedyToken(TOKEN.DOUBLE_DASH, line, 2);
      case '=':
        return this.makeGreedyToken(TOKEN.EQUALS, line);
      case '+':
        return this.makeGreedyToken(TOKEN.TRIPLE_PLUS, line, 3);
      case ':':
        return this.makeGreedyToken(TOKEN.DOUBLE_COLON, line, 2);
      case '*':
        tok = this.makeGreedyToken(TOKEN.ASTERISK, line);
        if (tok.literal.length === 3) {
          tok.type = TOKEN.TRIPLE_ASTERISK;
        } else if (tok.literal.length !== 1) {
          tok.type = TOKEN.ILLEGAL;
        }
        return tok;
      case '_':
        tok = this.makeGreedyToken(TOKEN.SINGLE_UNDERSCORE, line);
        if (tok.literal.length === 4) {
          tok.type = TOKEN.QUOTE_BLOCK_DELIMITER;
        } else if (tok.literal.length === 2) {
          tok.type = TOKEN.DOUBLE_UNDERSCORE;
        } else if (tok.literal.length !== 1) {
          tok.type = TOKEN.ILLEGAL;
        }
        return tok;
      case `\``:
        if (this.peekChar() === `"`) {
          tok = this.makeToken(TOKEN.RIGHT_DOUBLE_CURLY, line, false);
          return this.requireAppendChar(tok, line);
        } else if (this.peekChar() == `'`) {
          tok = this.makeToken(TOKEN.RIGHT_SINGLE_CURLY, line, false);
          return this.requireAppendChar(tok, line);
        } else {
          return this.makeToken(TOKEN.BACKTICK, line);
        }
      case `'`:
        if (this.peekChar() === `\``) {
          tok = this.makeToken(TOKEN.LEFT_SINGLE_CURLY, line, false);
          return this.requireAppendChar(tok, line);
        } else if (this.peekChar() === `'`) {
          return this.makeGreedyToken(TOKEN.ASTERISM, line, 3);
        }
      case `"`:
        if (this.peekChar() === `\``) {
          tok = this.makeToken(TOKEN.LEFT_DOUBLE_CURLY, line, false);
          return this.requireAppendChar(tok, line);
        }
      default:
        if (isTextChar(char)) {
          tok = this.makeToken(TOKEN.TEXT, line, false);
          while (isTextChar(this.peekChar())) {
            const nextChar = this.requireNextChar();
            tok.literal += nextChar;
            tok.column.end += 1;
          }
          line.charIdx++;
          const embedMatch = tok.literal.match(/(--|::)/);
          if (embedMatch) {
            const reverseChars = tok.literal.length - (embedMatch.index ?? 0);
            tok.column.end -= reverseChars;
            line.charIdx -= reverseChars;
            tok.literal = tok.literal.substring(0, tok.literal.length - reverseChars);
          }
          if (tok.literal === 'footnote:') {
            tok.type = TOKEN.FOOTNOTE_PREFIX;
          }
          return tok;
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

  private makeGreedyToken(type: TokenType, line: Line, requiredLength?: number): Token {
    const tok = this.makeToken(type, line, false);
    while (tok.literal[0] && this.peekChar() === tok.literal[0]) {
      tok.literal += this.requireNextChar();
      tok.column.end++;
    }
    line.charIdx++;
    if (typeof requiredLength === `number` && tok.literal.length !== requiredLength) {
      tok.type = TOKEN.ILLEGAL;
    }
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
