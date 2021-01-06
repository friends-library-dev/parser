import { AstChildNode, TOKEN as t } from './types';
import Parser from './Parser';
import SectionNode from './nodes/SectionNode';

export default class SectionParser {
  public constructor(private p: Parser) {}

  public parse(parent: AstChildNode, expectedLevel: number): SectionNode {
    // @TODO verify token is EQUALS
    const level = this.p.current.literal.length;
    if (level !== expectedLevel) {
      throw new Error(`Parse error: expected heading level 3, got ${level}`);
    }

    const section = new SectionNode(parent, 999);
    // @TODO lol
    return section;
  }
}
