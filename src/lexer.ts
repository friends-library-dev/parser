type TokenType = 'TEXT' | 'SINGLE_UNDERSCORE' | 'EOL' | 'EOF';

interface Token {
  type: TokenType;
  literal: string;
  lineNumber: number;
  columnStart: number;
  columnEnd: number;
  filename?: string;
}

export default class Lexer {
  filename: string | null = null;
  char: string | null = null;
  position = 0;
  nextPosition = 0;
  lineNumber = 1;
  column = 1;

  constructor(private input: string, filename: string | null = null) {
    this.input = input;
    this.filename = filename;
    this.char = null;
    this.readChar();
  }

  makeToken(type: TokenType, literal: string, columnStart?: number): Token {
    return {
      type,
      literal,
      lineNumber: this.lineNumber,
      columnStart: typeof columnStart === `number` ? columnStart : this.column,
      columnEnd: this.column,
      ...(this.filename !== null ? { filename: this.filename } : {}),
    };
  }

  nextToken(): Token {
    let token: Token;
    switch (this.char) {
      case '_':
        this.readChar();
        return this.makeToken(`SINGLE_UNDERSCORE`, `_`);
      case null:
        return this.makeToken(`EOF`, ``);
      case '\n':
        return this.makeToken(`EOL`, `\n`);
      default: {
        let literal = '';
        const columnStart = this.column;
        while (isLetter(this.char)) {
          literal += this.char;
          this.readChar();
        }
        return this.makeToken(`TEXT`, literal, columnStart);
      }
    }
  }

  private readChar() {
    if (this.nextPosition >= this.input.length) {
      this.char = null;
    } else {
      this.char = this.input[this.nextPosition] ?? null;
    }

    if (this.char == `\n`) {
      this.lineNumber += 1;
      this.column = 0;
    }

    this.position += 1;
    this.nextPosition += 1;
    this.column += 1;
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
