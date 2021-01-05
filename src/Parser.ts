import { AstNode, Token, TokenType, TOKEN as t, AstChildNode } from './types';
import Lexer from './lexer';
import DocumentNode from './nodes/DocumentNode';
import ChapterNode from './nodes/ChapterNode';
import HeadingNode from './nodes/HeadingNode';
import TextNode from './nodes/TextNode';
import ParagraphNode from './nodes/ParagraphNode';

export default class Parser {
  private tokens: Token[] = [];

  constructor(private lexer: Lexer) {}

  public parse(): AstNode {
    const document = new DocumentNode();
    this.parseDocumentEpigraphs();
    let token = this.consume();

    // console.log(this.lexer.tokens());
    document.children.push(this.parseChapter(document));
    // while (token.type !== TOKEN.EOF) {
    //   document.children.push(this.parseChapter());
    // }

    return document;
  }

  private parseChapter(document: DocumentNode): AstChildNode {
    if (!this.peekTokens([t.EQUALS, `==`], t.WHITESPACE, t.TEXT)) {
      throw new Error(`Unexpected missing chapter heading`);
    }
    this.consume(); // `==`
    this.consume(); // space after `==`

    const chapter = new ChapterNode(document);
    const heading = new HeadingNode(chapter, 2);
    chapter.children.push(heading);

    // this should relly be a sub-parse, because headings can have nodes in them...
    let text: string[] = [];
    while (this.currentOneOf(t.TEXT, t.WHITESPACE)) {
      const token = this.consume();
      if (token.type !== t.WHITESPACE) {
        text.push(token.literal);
      }
    }
    heading.children.push(new TextNode(heading, text.join(' ')));

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

  private currentOneOf(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.current.type === type) {
        return true;
      }
    }
    return false;
  }

  private get current(): Token {
    return this.lookAhead(0);
  }

  private get peek(): Token {
    return this.lookAhead(1);
  }

  private parseDocumentEpigraphs(): void {
    // TODO
  }

  private peekTokens(
    ...types: (TokenType | [type: TokenType, literal: string])[]
  ): boolean {
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      if (type === undefined) {
        throw new Error(`Unexpected missing token in peekTokens()`);
      }
      const tokenType: TokenType = Array.isArray(type) ? type[0] : type;
      const tokenLiteral = Array.isArray(type) ? type[1] : null;
      const actual = this.lookAhead(i);
      if (
        actual.type !== tokenType ||
        (tokenLiteral !== null && actual.literal != tokenLiteral)
      ) {
        return false;
      }
    }
    return true;
  }

  private consume(expectedTokenType?: TokenType): Token {
    const token = this.lookAhead(0);
    if (expectedTokenType && expectedTokenType !== token.type) {
      throw new Error(`Expected token ${expectedTokenType} and found ${token.type}`);
    }

    this.tokens.shift();
    return token;
  }

  private lookAhead(distance: number): Token {
    while (distance >= this.tokens.length) {
      this.tokens.push(this.lexer.nextToken());
    }

    const token = this.tokens[distance];
    if (!token) {
      throw new Error(`Unexpected missing token`);
    }
    return token;
  }
}
