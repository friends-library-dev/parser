import {
  AstNode,
  Token,
  TokenType,
  TOKEN as t,
  AstChildNode,
  NodeType,
  TokenSpec,
} from './types';
import Lexer from './lexer';
import Context from './Context';
import DocumentNode from './nodes/DocumentNode';
import getParselet from './parselets';
import ChapterParser from './parsers/ChapterParser';
import ContextParser from './parsers/ContextParser';

// example blocks
// example blocks INSIDE open blocks
// poetry blocks
// footnotes
// chapter headings
// tables :(

export default class Parser {
  public tokens: Token[] = [];
  private stopStack: Array<TokenSpec[]> = [];

  constructor(public lexer: Lexer) {}

  public parse(): AstNode {
    const document = new DocumentNode();
    this.parseDocumentEpigraphs();

    const guard = this.makeWhileGuard(`Parser.parse()`);
    while (guard() && this.current.type !== t.EOF) {
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

  public parseDocumentEpigraphs(): void {
    // TODO
  }

  public currentIs(tokenSpec: TokenSpec): boolean {
    return this.tokenMatchesSpec(this.current, tokenSpec);
  }

  public peekIs(tokenSpec: TokenSpec): boolean {
    return this.tokenMatchesSpec(this.peek, tokenSpec);
  }

  public assertLineStart(): void {
    if (this.current.column.start !== 1) {
      this.error(`line start assertion failed`);
    }
  }

  public firstTokenAfterOptionalContext(): Token {
    if (!this.currentIs(t.LEFT_BRACKET)) {
      return this.current;
    }

    let lookAheadIndex = 1;
    const guard = this.makeWhileGuard(`Parser.firstTokenAfterOptionalContext()`);
    while (guard()) {
      const token = this.lookAhead(lookAheadIndex++);
      if (token.column.start === 1 || token.type === t.EOF || token.type === t.EOD) {
        return token;
      }
    }
    this.error(`error finding first token after optional context`);
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
      if (!this.tokenMatchesSpec(this.lookAhead(i), spec)) {
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

  private tokenMatchesSpec(token: Token, spec: TokenSpec): boolean {
    const tokenType: TokenType = Array.isArray(spec) ? spec[0] : spec;
    const tokenLiteral = Array.isArray(spec) ? spec[1] : null;
    if (token.type !== tokenType) {
      return false;
    }
    if (tokenLiteral !== null && token.literal !== tokenLiteral) {
      return false;
    }
    return true;
  }

  public consume(expectedType?: TokenType, expectedLiteral?: string): Token {
    const token = this.lookAhead(0);
    if (expectedType && expectedType !== token.type) {
      this.error(`Expected token type ${expectedType}, got ${token.type}`);
    }

    if (typeof expectedLiteral === `string` && expectedLiteral !== token.literal) {
      this.error(`Expected token literal "${expectedLiteral}", got "${token.literal}"`);
    }

    this.tokens.shift();
    return token;
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
      if (Array.isArray(tokenSpec)) {
        this.consume(tokenSpec[0], tokenSpec[1]);
      } else {
        this.consume(tokenSpec);
      }
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

  public log(msg?: string): void {
    console.log(`${msg ? `(${msg}) ` : ``}CURRENT:---`, this.current);
    console.log(`${msg ? `(${msg}) ` : ``}PEEK:------`, this.peek);
  }
}

function location(token: Token): string {
  let location = `${token.filename ?? `[no-file]`}:`;
  location += `${token.line}:${token.column.start}`;
  return location;
}
