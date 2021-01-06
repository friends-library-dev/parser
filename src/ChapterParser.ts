import { TOKEN as t } from './types';
import Parser from './Parser';
import BlockParser from './BlockParser';
import SectionParser from './SectionParser';
import ChapterNode from './nodes/ChapterNode';
import DocumentNode from './nodes/DocumentNode';
import HeadingNode from './nodes/HeadingNode';
import SectionNode from './nodes/SectionNode';

export default class ChapterParser {
  public constructor(private p: Parser) {}

  public parse(parent: DocumentNode): ChapterNode {
    const chapter = new ChapterNode(parent);

    if (!this.p.peekTokens([t.EQUALS, `==`], t.WHITESPACE, t.TEXT)) {
      throw new Error(`Unexpected missing chapter heading`);
    }
    this.p.consume(t.EQUALS);
    this.p.consume(t.WHITESPACE);

    const chapterHeading = new HeadingNode(chapter, 2);
    chapter.children.push(chapterHeading);
    chapterHeading.children = this.p.parseUntil(chapterHeading, t.DOUBLE_EOL);

    const guard = this.p.makeWhileGuard(`ChapterParser.parse()`);
    while (guard() && this.p.currentIs(t.DOUBLE_EOL)) {
      this.p.consume(t.DOUBLE_EOL);

      // @TODO parse (or skip?) optional `context`(? naming...), like `[.offset]`

      // chapters only contain sections or blocks at the top level (i hope...)
      if (this.p.currentIs(t.EQUALS)) {
        const sectionParser = new SectionParser(this.p);
        const section = sectionParser.parse(chapter, 3);
        chapter.children.push(section);
      } else {
        console.log('in here');
        const blockParser = new BlockParser(this.p);
        const block = blockParser.parse(chapter);
        chapter.children.push(block);
      }
    }

    if (this.p.peekTokens(t.EOL, t.EOF)) {
      // no more blocks in chapter, consume trailing newline
      this.p.consume(t.EOL);
    }

    return chapter;
  }
}
