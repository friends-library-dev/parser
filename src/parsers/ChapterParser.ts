import { TOKEN as t } from '../types';
import Parser from '../Parser';
import SectionParser from './SectionParser';
import ChapterNode from '../nodes/ChapterNode';
import DocumentNode from '../nodes/DocumentNode';
import HeadingNode from '../nodes/HeadingNode';

export default class ChapterParser {
  public constructor(private p: Parser) {}

  public parse(parent: DocumentNode): ChapterNode {
    const context = this.p.parseContext();
    const chapter = new ChapterNode(parent, context);

    if (!this.p.peekTokens([t.EQUALS, `==`], t.WHITESPACE, t.TEXT)) {
      this.p.error(`unexpected missing chapter heading`);
    }
    this.p.consume(t.EQUALS);
    this.p.consume(t.WHITESPACE);

    const chapterHeading = new HeadingNode(chapter, 2);
    chapterHeading.children = this.p.parseUntil(chapterHeading, t.DOUBLE_EOL);
    chapter.children = [
      chapterHeading,
      ...new SectionParser(this.p, 2).parseBody(chapter),
    ];

    if (this.p.peekTokens(t.EOL, t.EOF)) {
      // no more blocks in chapter, consume trailing newline
      this.p.consume(t.EOL);
    }

    return chapter;
  }
}
