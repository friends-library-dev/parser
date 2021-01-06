import { LexerInput, Token, TokenType, Line, TOKEN as t } from './types';

export default class Lexer {
  public inputs: LexerInput[] = [];
  public inputIdx = -1;
  public line: null | Line = null;
  public lines: Line[] = [];
  public lastToken?: Token;
  public bufferedToken?: Token;

  public constructor(...inputs: LexerInput[]) {
    this.inputs = inputs;
  }

  public tokens(): Token[] {
    const tokens: Token[] = [];
    while (true) {
      const current = this.nextToken();
      tokens.push(current);
      if (current.type === t.EOD) {
        return tokens;
      }
    }
  }

  public nextToken(): Token {
    let tok: Token;
    if (this.bufferedToken) {
      tok = this.bufferedToken;
      this.bufferedToken = undefined;
      return tok;
    }

    const line = this.currentLine();
    if (!line) {
      return this.makeToken(t.EOD, null);
    }

    const char = line.content[line.charIdx];
    if (char === undefined) {
      this.line = null;
      return this.nextToken();
    }

    switch (char) {
      case ',':
        return this.makeToken(t.COMMA, line);
      case '.':
        return this.makeToken(t.DOT, line);
      case '[':
        return this.makeToken(t.LEFT_BRACE, line);
      case ']':
        return this.makeToken(t.RIGHT_BRACE, line);
      case '(':
        return this.makeToken(t.LEFT_PARENS, line);
      case ')':
        return this.makeToken(t.RIGHT_PARENS, line);
      case '^':
        return this.makeToken(t.CARET, line);
      case '_':
        return this.makeGreedyToken(t.UNDERSCORE, line);
      case '|':
        return this.makeToken(t.PIPE, line);
      case ' ':
        return this.makeGreedyToken(t.WHITESPACE, line);
      case '=':
        return this.makeGreedyToken(t.EQUALS, line);
      case '$':
        return this.makeToken(t.DOLLAR_SYMBOL, line);
      case '£':
        return this.makeToken(t.POUND_SYMBOL, line);
      case '#':
        return this.makeToken(t.HASH, line);
      case '°':
        return this.makeToken(t.DEGREE_SYMBOL, line);
      case '\n':
        tok = this.makeToken(t.EOL, line);
        const nextLine = this.nextLine();
        if (nextLine && nextLine.content === `\n`) {
          tok.type = t.DOUBLE_EOL;
          this.setLiteral(tok, `\n\n`, line);
          this.nextLine();
        }
        return tok;
      case `&`:
        const entityMatch = line.content.substring(line.charIdx).match(/^&#?[a-z0-9]+;/);
        if (entityMatch !== null) {
          tok = this.makeToken(t.ENTITY, line);
          this.setLiteral(tok, entityMatch[0] || ``, line);
          return tok;
        } else {
          return this.makeToken(t.AMPERSAND, line);
        }
      case '/':
        if (line.charIdx === 0 && this.peekChar() === '/') {
          tok = this.makeToken(t.COMMENT, line);
          return this.setLiteral(tok, line.content.replace(`\n`, ``), line);
        }
        return this.makeToken(t.FORWARD_SLASH, line);
      case '+':
        if (this.peekChar() === `+`) {
          return this.makeGreedyToken(t.TRIPLE_PLUS, line, 3);
        } else {
          return this.makeToken(t.PLUS, line);
        }
      case ':':
        tok = this.makeGreedyToken(t.DOUBLE_COLON, line);
        if (tok.literal.length === 1) {
          tok.type = t.TEXT;
        } else if (tok.literal.length !== 2) {
          tok.type = t.ILLEGAL;
        }
        return tok;
      case '{':
        if (line.charIdx === 0 && line.content === `${FOOTNOTE_PARA_SPLIT}\n`) {
          tok = this.makeToken(t.FOOTNOTE_PARAGRAPH_SPLIT, line);
          return this.setLiteral(tok, FOOTNOTE_PARA_SPLIT, line);
        }
      case '*':
        tok = this.makeGreedyToken(t.ASTERISK, line);
        if (tok.literal.length === 3) {
          tok.type = t.TRIPLE_ASTERISK;
        } else if (tok.literal.length === 2) {
          tok.type = t.DOUBLE_ASTERISK;
        } else if (tok.literal.length !== 1) {
          tok.type = t.ILLEGAL;
        }
        return tok;
      case '-':
        if (line.content.substring(line.charIdx) === `${FOOTNOTE_STANZA}\n`) {
          tok = this.makeToken(t.FOOTNOTE_STANZA, line);
          return this.setLiteral(tok, FOOTNOTE_STANZA, line);
        }
        return this.makeGreedyToken(t.DOUBLE_DASH, line, 2);
      case `\``:
        if (this.peekChar() === `"`) {
          tok = this.makeToken(t.RIGHT_DOUBLE_CURLY, line, false);
          return this.requireAppendChar(tok, line);
        } else if (this.peekChar() == `'`) {
          tok = this.makeToken(t.RIGHT_SINGLE_CURLY, line, false);
          return this.requireAppendChar(tok, line);
        } else {
          return this.makeToken(t.BACKTICK, line);
        }
      case `'`:
        if (this.peekChar() === `\``) {
          tok = this.makeToken(t.LEFT_SINGLE_CURLY, line, false);
          return this.requireAppendChar(tok, line);
        } else if (this.peekChar() === `'`) {
          return this.makeGreedyToken(t.ASTERISM, line, 3);
        }
      case `"`:
        if (this.peekChar() === `\``) {
          tok = this.makeToken(t.LEFT_DOUBLE_CURLY, line, false);
          return this.requireAppendChar(tok, line);
        } else {
          return this.makeToken(t.STRAIGHT_DOUBLE_QUOTE, line);
        }
      default:
        tok = this.makeToken(t.TEXT, line, false);
        while (!isTextBoundaryChar(this.peekChar())) {
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
          tok.type = t.FOOTNOTE_PREFIX;
        }
        return tok;
    }
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
      tok.type = t.ILLEGAL;
    }
    return tok;
  }

  private setLiteral(token: Token, literal: string, line: Line): Token {
    token.literal = literal;
    token.column.end += literal.length - 1;
    line.charIdx += literal.length - 1;
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

    // we reached the end of a file
    if (this.inputIdx > -1) {
      this.bufferedToken = this.makeToken(t.EOF, null);
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

function isTextBoundaryChar(char: string | null) {
  if (char === null) {
    return true;
  }
  return [
    ` `,
    `\n`,
    `.`,
    `,`,
    `]`,
    `[`,
    `^`,
    `\``,
    `'`,
    `_`,
    `"`,
    `+`,
    `$`,
    `°`,
    `&`,
    `#`,
    `(`,
    `)`,
    `*`,
    `=`,
  ].includes(char);
}

const FOOTNOTE_PARA_SPLIT = `{footnote-paragraph-split}`;
const FOOTNOTE_STANZA = `- - - - - -`;
