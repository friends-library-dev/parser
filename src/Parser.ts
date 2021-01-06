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
import DocumentNode from './nodes/DocumentNode';
import ChapterNode from './nodes/ChapterNode';
import HeadingNode from './nodes/HeadingNode';
import TextNode from './nodes/TextNode';
import ParagraphNode from './nodes/ParagraphNode';
import getParselet from './parselets';
import ChapterParser from './ChapterParser';

// TODO 2: Lexer EOF/EOD change
// block parser loop should BREAK when it sees EOL..EOF

export default class Parser {
  public tokens: Token[] = [];
  private stopStack: Array<TokenSpec[]> = [];

  constructor(public lexer: Lexer) {}

  public parse(): AstNode {
    const document = new DocumentNode();
    this.parseDocumentEpigraphs();

    let failsafe = 0;
    while (this.current.type !== t.EOF) {
      const chapterParser = new ChapterParser(this);
      document.children.push(chapterParser.parse(document));

      failsafe++;
      if (failsafe > 150) {
        throw new Error(`Infinite loop in Parser.parse()`);
      }
    }

    return document;
  }

  public parseUntil(parent: AstChildNode, ...stopTokens: TokenSpec[]): AstChildNode[] {
    this.stopStack.unshift(stopTokens);
    const nodes: AstChildNode[] = [];

    let infiniteLoopStopper = 0;

    while (!this.stopTokensFound()) {
      const parselet = getParselet(this.current);
      if (parselet === null) {
        throw new Error(`No parselet found for token type=${this.current.type}`);
      }
      nodes.push(parselet(this, parent));

      infiniteLoopStopper++;
      if (infiniteLoopStopper > 150) {
        throw new Error(`Infinite loop in Parser.parseUntil()`);
      }
    }
    this.stopStack.shift();
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

  public parseChapter(document: DocumentNode): AstChildNode {
    if (!this.peekTokens([t.EQUALS, `==`], t.WHITESPACE, t.TEXT)) {
      throw new Error(`Unexpected missing chapter heading`);
    }
    this.consume(t.EQUALS);
    this.consume(t.WHITESPACE);

    const chapter = new ChapterNode(document);
    const heading = new HeadingNode(chapter, 2);
    chapter.children.push(heading);

    heading.children = this.parseUntil(heading, t.EOL);

    this.consume(t.EOL);
    this.consume(t.EOL);

    // make generic, ok?
    const paragraph = new ParagraphNode(chapter);

    let paraText = ``;
    while (this.current.type !== t.EOL) {
      const token = this.consume();
      if (token.type === t.WHITESPACE) {
        paraText += ` `;
      } else {
        paraText += token.literal;
      }
    }
    paragraph.children.push(new TextNode(paragraph, paraText));
    chapter.children.push(paragraph);

    return chapter;
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
      throw new Error(`Expected token type=${expectedType} and found ${token.type}`);
    }

    if (typeof expectedLiteral === `string` && expectedLiteral !== token.literal) {
      throw new Error(
        `Expected token literal="${expectedLiteral}" and found "${token.literal}"`,
      );
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
      throw new Error(`Unexpected missing token`);
    }
    return token;
  }

  public consumeClose(tokenSpec: TokenSpec, nodeType: NodeType, openToken: Token): void {
    try {
      if (Array.isArray(tokenSpec)) {
        this.consume(tokenSpec[0], tokenSpec[1]);
      } else {
        this.consume(tokenSpec);
      }
    } catch {
      let err = [
        `Parse error: unclosed ${nodeType} node, opened at `,
        `${openToken.filename ? `${openToken.filename}:` : ``}`,
        `${openToken.line}:${openToken.column.start}`,
      ].join(``);
      throw new Error(err);
    }
  }

  public makeWhileGuard(identifier: string): () => boolean {
    const maxIterations = typeof process?.env?.JEST_WORKER_ID !== undefined ? 200 : 10000;
    let numIterations = 0;
    return () => {
      numIterations++;
      if (numIterations >= maxIterations) {
        throw new Error(`Infinite loop detected in ${identifier}`);
      }
      return true;
    };
  }
}
