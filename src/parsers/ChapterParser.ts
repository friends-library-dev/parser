import { AstNode, TOKEN as t, NODE as n } from '../types';
import Parser from '../Parser';
import SectionParser from './SectionParser';
import DocumentNode from '../nodes/DocumentNode';
import Node from '../nodes/AstNode';

export default class ChapterParser {
  public constructor(private p: Parser) {}

  public parse(parent: DocumentNode): AstNode {
    const context = this.p.parseContext();
    const chapter = new Node(n.CHAPTER, parent, { context, startToken: this.p.current });

    if (!this.p.peekTokens([t.EQUALS, `==`], t.WHITESPACE, t.TEXT)) {
      this.p.error(`unexpected missing chapter heading`);
    }

    const headingStart = this.p.consume(t.EQUALS);
    this.p.consume(t.WHITESPACE);

    const heading = new Node(n.HEADING, chapter, { level: 2, startToken: headingStart });
    heading.children = this.p.parseUntil(heading, t.DOUBLE_EOL);
    heading.endToken = this.p.lastNonEOX();
    chapter.children = [heading, ...new SectionParser(this.p, 2).parseBody(chapter)];
    chapter.endToken = this.p.lastNonEOX();

    if (this.p.peekTokens(t.EOL, t.EOF)) {
      // no more blocks in chapter, consume trailing newline
      this.p.consume(t.EOL);
    }

    return chapter;
  }
}
