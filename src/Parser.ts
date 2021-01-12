import {
  AstNode,
  Token,
  TokenType,
  TOKEN as t,
  AstChildNode,
  NodeType,
  TokenSpec,
  TokenTypeMatcher,
  Lexer,
} from './types';
import Context from './Context';
import DocumentNode from './nodes/DocumentNode';
import getParselet from './parselets';
import ChapterParser from './parsers/ChapterParser';
import BlockParser from './parsers/BlockParser';
import ContextParser from './parsers/ContextParser';
import BufferedLexer from './BufferedLexer';
import BlockNode from './nodes/BlockNode';

// epigraphs
// footnotes
// chapter headings
// tables :(

export default class Parser {
  public tokens: Token[] = [];
  private stopStack: Array<TokenSpec[]> = [];

  constructor(public lexer: Lexer) {}

  public parse(): AstNode {
    const document = new DocumentNode();
    this.parseDocumentEpigraphs(document);

    const guard = this.makeWhileGuard(`Parser.parse()`);
    while (guard() && !this.currentOneOf(t.EOF, t.EOD)) {
      const chapterParser = new ChapterParser(this);
      document.children.push(chapterParser.parse(document));
    }

    return document;
  }

  public parseContext(): Context | undefined {
    const contextParser = new ContextParser(this);
    return contextParser.parse();
  }

  public parseUntil(parent: AstChildNode, ...stopTokens: TokenSpec[]): AstChildNode[] {
    return this.parseUntilAnyOf(parent, ...[stopTokens]);
  }

  public parseUntilAnyOf(
    parent: AstChildNode,
    ...stopTokensGroups: TokenSpec[][]
  ): AstChildNode[] {
    this.stopStack = stopTokensGroups.concat(this.stopStack);
    const nodes: AstChildNode[] = [];
    const guard = this.makeWhileGuard(`Parser.parseUntilAnyOf()`);
    while (guard() && !this.stopTokensFound()) {
      const parselet = getParselet(this.current);
      if (parselet === null) {
        this.log(``, 5);
        throw new Error(`No parselet found for token type=${this.current.type}`);
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

  public getBufferedParser(...stopTokens: TokenSpec[]): Parser {
    const tokens: Token[] = [];
    const guard = this.makeWhileGuard(`Parser.getBufferedParser()`);
    while (guard() && !this.peekTokens(...stopTokens)) {
      const token = this.consume();
      tokens.push(token);
      if (token.type === t.EOD && !this.peekTokens(...stopTokens)) {
        this.error(`failed to find ending tokens for buffered parser`);
      }
    }
    this.consumeMany(...stopTokens);

    // ensure we end with EOL, like real files do, so consumers can be ignorant
    // that they are dealing with a buffered lexer instead of a real one
    const last = tokens.pop();
    if (last) {
      tokens.push(last);
      if (!this.tokenIs(last, t.EOX)) {
        tokens.push({ ...last, type: t.EOL, literal: `` });
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
      this.error(`unexpected token ${this.logToken(token, ``)}`);
    }
    this.tokens.shift();
    return token;
  }

  public consumeMany(...specs: TokenSpec[]): Token[] {
    return specs.map((spec) => this.consume(spec));
  }

  public lookAhead(distance: number): Token {
    while (distance >= this.tokens.length) {
      this.tokens.push(this.lexer.nextToken());
    }

    const token = this.tokens[distance];
    if (!token) {
      this.error(`Unexpected missing token`);
    }
    return token;
  }

  public consumeClose(tokenSpec: TokenSpec, nodeType: NodeType, open: Token): void {
    try {
      this.consume(tokenSpec);
    } catch {
      throw new Error(
        `Parse error: unclosed ${nodeType} node, opened at ${location(open)}`,
      );
    }
  }

  public makeWhileGuard(identifier: string, max?: number): () => boolean {
    let maxIterations = typeof process?.env?.JEST_WORKER_ID !== undefined ? 200 : 5000;
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

  public error(msg: string): never {
    throw new Error(`Parse error: ${msg}, at ${location(this.current)}`);
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
  let location = `${token.filename ?? `[no-file]`}:`;
  location += `${token.line}:${token.column.start}`;
  return location;
}
