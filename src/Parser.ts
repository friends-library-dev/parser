import {
  Token,
  TokenType,
  TOKEN as t,
  NODE as n,
  AstNode,
  NodeType,
  TokenSpec,
  TokenTypeMatcher,
  Lexer,
} from './types';
import Context from './Context';
import DocumentNode from './nodes/DocumentNode';
import Node from './nodes/AstNode';
import getParselet from './parselets';
import ChapterParser from './parsers/ChapterParser';
import BlockParser from './parsers/BlockParser';
import ContextParser from './parsers/ContextParser';
import BufferedLexer from './BufferedLexer';
import HeadingParser from './parsers/HeadingParser';

// new line numbers?
// compile time
// chapter headings
// tables :(

export default class Parser {
  private static MAX_SHIFTED_TOKENS = 50;
  public tokens: Token[] = [];
  private stopStack: Array<TokenSpec[]> = [];
  private shifted: Token[] = [];

  constructor(public lexer: Lexer) {}

  public parse(): AstNode {
    const document = new DocumentNode();
    document.startToken = this.current;
    this.parseDocumentEpigraphs(document);

    const guard = this.makeWhileGuard(`Parser.parse()`);
    while (guard() && !this.currentOneOf(t.EOF, t.EOD)) {
      const chapterParser = new ChapterParser(this);
      document.children.push(chapterParser.parse(document));
    }

    document.endToken = this.current;
    return document;
  }

  public parseContext(): Context | undefined {
    const contextParser = new ContextParser(this);
    return contextParser.parse();
  }

  public parseHeading(parent: AstNode): AstNode {
    const headingParser = new HeadingParser(this);
    return headingParser.parse(parent);
  }

  public parseUntil(parent: AstNode, ...stopTokens: TokenSpec[]): AstNode[] {
    return this.parseUntilAnyOf(parent, ...[stopTokens]);
  }

  public parseUntilAnyOf(parent: AstNode, ...stopTokensGroups: TokenSpec[][]): AstNode[] {
    this.stopStack = stopTokensGroups.concat(this.stopStack);
    const nodes: AstNode[] = [];
    const guard = this.makeWhileGuard(`Parser.parseUntilAnyOf()`);
    while (guard() && !this.stopTokensFound()) {
      const parselet = getParselet(this.current);
      if (parselet === null) {
        this.error(`no parselet found for token type=${this.current.type}`);
      }
      nodes.push(parselet(this, parent));
    }
    for (const _ of stopTokensGroups) {
      this.stopStack.shift();
    }
    return nodes;
  }

  public stopTokensFound(): boolean {
    for (const stopTokens of this.stopStack) {
      if (this.peekTokens(...stopTokens)) {
        return true;
      }
    }
    return false;
  }

  public currentOneOf(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.current.type === type) {
        return true;
      }
    }
    return false;
  }

  public get current(): Token {
    return this.lookAhead(0);
  }

  public get peek(): Token {
    return this.lookAhead(1);
  }

  public parseDocumentEpigraphs(document: DocumentNode): void {
    if (this.peekTokens(t.LEFT_BRACKET, [t.TEXT, `quote`], t.DOT, [t.TEXT, `epigraph`])) {
      const blockParser = new BlockParser(this);
      const epigraph = blockParser.parse(document);
      document.epigraphs.push(epigraph);
      this.parseDocumentEpigraphs(document);
    }
  }

  public currentIs(tokenSpec: TokenSpec): boolean {
    return this.tokenIs(this.current, tokenSpec);
  }

  public peekIs(tokenSpec: TokenSpec): boolean {
    return this.tokenIs(this.peek, tokenSpec);
  }

  public assertLineStart(): void {
    if (this.current.column.start !== 1) {
      this.error(`line start assertion failed`);
    }
  }

  public firstTokensAfterOptionalContext(): [Token, Token, Token] {
    if (!this.currentIs(t.LEFT_BRACKET)) {
      return [this.current, this.peek, this.lookAhead(2)];
    }

    let lookAheadIndex = 1;
    const guard = this.makeWhileGuard(`Parser.firstTokenAfterOptionalContext()`);
    while (guard()) {
      const token = this.lookAhead(lookAheadIndex++);
      if (token.column.start === 1 || token.type === t.EOF || token.type === t.EOD) {
        return [
          token,
          this.lookAhead(lookAheadIndex),
          this.lookAhead(lookAheadIndex + 1),
        ];
      }
    }
    this.error(`error finding first token after optional context`);
  }

  public getBufferedParser(
    shouldStop: (parser: Parser) => boolean,
    numConsumeAfter: number,
  ): Parser {
    const tokens: Token[] = [];
    const guard = this.makeWhileGuard(`Parser.getBufferedParser()`);
    while (guard() && !shouldStop(this)) {
      const token = this.consume();
      tokens.push(token);
      if (token.type === t.EOD && !shouldStop(this)) {
        this.error(`failed to find ending tokens for buffered parser`);
      }
    }

    for (let i = 0; i < numConsumeAfter; i++) {
      this.consume();
    }

    // ensure we end with EOL, like real files do, so consumers can be ignorant
    // that they are dealing with a buffered lexer instead of a real one
    const last = tokens.pop();
    if (last) {
      tokens.push(last);
      if (!this.tokenIs(last, t.EOX)) {
        tokens.push({ ...last, type: t.EOL, literal: `\n` });
      }
    }

    return new Parser(new BufferedLexer(tokens));
  }

  /**
   * Do the next n-tokens match the passed specs?
   */
  public peekTokens(...specs: TokenSpec[]): boolean {
    for (let i = 0; i < specs.length; i++) {
      const spec = specs[i];
      if (spec === undefined) {
        throw new Error(`Unexpected missing token in peekTokens()`);
      }
      if (!this.tokenIs(this.lookAhead(i), spec)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Do the next tokens match ANY of the possiple arrays of specs?
   */
  public peekTokensAnyOf(...groups: TokenSpec[][]): boolean {
    return groups.some((tokens) => this.peekTokens(...tokens));
  }

  public peekHeading(): boolean {
    const [token1, token2] = this.firstTokensAfterOptionalContext();
    if (this.tokenIs(token1, t.EQUALS) && this.tokenIs(token2, t.WHITESPACE)) {
      return token1.column.start === 1;
    }
    return false;
  }

  public tokenIs(token: Token, spec: TokenSpec): boolean {
    const tokenTypeMatch: TokenTypeMatcher = Array.isArray(spec) ? spec[0] : spec;
    let tokenTypes: TokenType[] = [];
    if (tokenTypeMatch === `EOX`) {
      tokenTypes = [t.EOL, t.DOUBLE_EOL, t.EOF, t.EOD];
    } else {
      tokenTypes = [tokenTypeMatch];
    }

    if (!tokenTypes.includes(token.type)) {
      return false;
    }

    const tokenLiteral = Array.isArray(spec) ? spec[1] : null;
    if (tokenLiteral !== null && token.literal !== tokenLiteral) {
      return false;
    }
    return true;
  }

  public consume(spec?: TokenSpec): Token {
    const token = this.lookAhead(0);
    if (spec && !this.tokenIs(token, spec)) {
      this.error(`unexpected token ${this.logToken(token, ``)}\nexpected ${spec}`);
    }
    this.shiftToken();
    return token;
  }

  private shiftToken(): void {
    const shifted = this.tokens.shift();
    if (!shifted) {
      return;
    }

    if (this.shifted.length === Parser.MAX_SHIFTED_TOKENS) {
      this.shifted = this.shifted.slice(0, -1);
    }
    this.shifted.unshift(shifted);
  }

  public consumeMany(...specs: TokenSpec[]): Token[] {
    return specs.map((spec) => this.consume(spec));
  }

  public consumeIf(spec: TokenSpec): Token | undefined {
    if (this.currentIs(spec)) {
      return this.consume();
    }
  }

  public lookAhead(distance: number): Token {
    if (distance < 0) {
      return this.expectLookBehind(distance);
    }

    while (distance >= this.tokens.length) {
      this.tokens.push(this.lexer.nextToken());
    }

    const token = this.tokens[distance];
    if (!token) {
      this.error(`unexpected missing token in Parser.lookAhead()`);
    }
    return token;
  }

  public lookBehind(distance: number): Token | undefined {
    if (distance === 0) {
      // 0 always refers to current token
      return this.lookAhead(0);
    }
    return this.shifted[Math.abs(distance) - 1];
  }

  public expectLookBehind(distance: number): Token {
    if (distance >= 0) {
      return this.lookAhead(distance);
    }
    const token = this.lookBehind(distance);
    if (!token) {
      this.error(`unexpected missing token in Parser.expectLookBehind()`);
    }
    return token;
  }

  public lastSignificantToken(): Token {
    let index = -1;
    let token = this.current;
    const guard = this.makeWhileGuard(`Parser.lastSignificantToken()`);
    while (
      guard() &&
      (this.tokenIs(token, t.EOX) || this.tokenIs(token, t.FOOTNOTE_PARAGRAPH_SPLIT))
    ) {
      token = this.expectLookBehind(index--);
    }
    return token;
  }

  public consumeClose(tokenSpec: TokenSpec, nodeType: NodeType, open: Token): Token {
    try {
      return this.consume(tokenSpec);
    } catch {
      throw new Error(
        `Parse error: unclosed ${nodeType} node, opened at ${location(open)}`,
      );
    }
  }

  public makeWhileGuard(identifier: string, max?: number): () => boolean {
    let maxIterations = this.isJestTest() ? 200 : 25000;
    if (typeof max === `number`) {
      maxIterations = max;
    }

    let numIterations = 0;
    return () => {
      numIterations++;
      if (numIterations >= maxIterations) {
        this.error(`Infinite loop detected in ${identifier}`);
      }
      return true;
    };
  }

  private isJestTest(): boolean {
    return typeof process?.env?.JEST_WORKER_ID !== `undefined`;
  }

  public error(msg: string): never {
    let line = ``;
    const errorLine = this.current.line;
    let index = 0;
    let current: Token | undefined = this.current;
    while (current && !this.tokenIs(current, t.EOX)) {
      line += current.literal;
      current = this.lookAhead(++index);
    }

    index = 0;
    current = this.shifted[index++];
    while (current && current.line === errorLine) {
      line = current.literal + line;
      current = this.shifted[index++];
    }

    const { column: col } = this.current;
    const display = [
      `Parse error: ${msg}\nat ${location(this.current)}`,
      `\n\n\x1b[35m${String(this.current.line).padStart(5, ' ')}\x1b[0m`,
      `\x1b[2m: ${line.trimEnd()}\x1b[0m\n`,
      `${' '.padStart(col.start + 6, ' ')}`,
      `\x1b[31m${`^`.padStart(col.end - col.start + 1, `^`)}-- ERR!\x1b[0m\n`,
    ].join(``);

    if (this.isJestTest() || typeof window !== 'undefined') {
      throw new Error(display);
    } else {
      console.log(`\n${display}`);
      process.exit(1);
    }
  }

  public log(msg = ``, distance = 3): void {
    const logged: string[] = [];
    for (let i = 0; i < distance; i++) {
      logged.push(this.logToken(this.lookAhead(i), `${i}`, msg));
    }
    console.log(logged.join(`\n`));
  }

  private logToken(token: Token, label?: string, msg?: string): string {
    let logStr = `${msg ? `(${msg}) ` : ``}${label ? `${label}: ` : ``}`;
    logStr += `{ type: ${token.type}, literal: ${this.printableLiteral(token.literal)} }`;
    return logStr;
  }

  private printableLiteral(literal: string): string {
    if (literal === `\n`) {
      return `"\\n"`;
    } else if (literal === `\n\n`) {
      return `"\\n\\n"`;
    }
    return `"${literal}"`;
  }
}

function location(token: Token): string {
  let filename = token.filename ?? `[no-file]`;
  if (process?.cwd) {
    filename = filename.replace(`${process.cwd()}/`, ``);
  }
  return `${filename}:${token.line}:${token.column.start}`;
}
