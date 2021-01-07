import { AstNode, TOKEN as t } from '../types';
import Parser from '../Parser';
import SectionNode from '../nodes/SectionNode';
import HeadingNode from '../nodes/HeadingNode';

export default class SectionParser {
  public constructor(private p: Parser) {}

  public parse(parent: AstNode, expectedLevel: number): SectionNode {
    const equals = this.p.current;
    this.p.consume(t.EQUALS);
    this.p.consume(t.WHITESPACE);

    const level = equals.literal.length;
    if (level !== expectedLevel) {
      this.p.error(`expected heading level ${expectedLevel}, got ${level}`);
    }

    const section = new SectionNode(parent, level);
    const heading = new HeadingNode(section, level);
    section.children.push(heading);
    heading.children = this.p.parseUntil(heading, t.DOUBLE_EOL);
    // @TODO lol
    return section;
  }
}
