import { AstChildNode, AstNode, TOKEN as t } from '../types';
import Parser from '../Parser';
import SectionNode from '../nodes/SectionNode';
import HeadingNode from '../nodes/HeadingNode';
import BlockParser from './BlockParser';

export default class SectionParser {
  public constructor(private p: Parser, public level: number) {}

  public parse(parent: AstNode): SectionNode {
    const equals = this.p.current;
    this.p.consume(t.EQUALS);
    this.p.consume(t.WHITESPACE);

    const level = equals.literal.length;
    if (level !== this.level) {
      this.p.error(`expected heading level ${this.level}, got ${level}`);
    }

    const section = new SectionNode(parent, level);
    const heading = new HeadingNode(section, level);
    heading.children = this.p.parseUntil(heading, t.DOUBLE_EOL);
    section.children = [heading, ...this.parseBody(section)];

    // @TODO lol
    return section;
  }

  public parseBody(section: SectionNode): AstChildNode[] {
    const nodes: AstChildNode[] = [];
    const guard = this.p.makeWhileGuard(`SectionParser.parseBody()`);
    while (guard() && this.p.currentIs(t.DOUBLE_EOL)) {
      this.p.consume(t.DOUBLE_EOL);

      // @TODO skip this with a this.p.firstTokenAfterOptionalContext() method
      // const context = this.p.parseContext();

      // chapters only contain sections or blocks at the top level (i hope...)
      if (this.p.currentIs(t.EQUALS)) {
        const sectionParser = new SectionParser(this.p, this.level + 1);
        const subSection = sectionParser.parse(section);
        nodes.push(subSection);
      } else {
        const blockParser = new BlockParser(this.p);
        const block = blockParser.parse(section);
        nodes.push(block);
      }
    }
    return nodes;
  }
}
