import { AstNode, TOKEN as t } from '../types';
import Parser from '../Parser';
import SectionNode from '../nodes/SectionNode';

export default class SectionParser {
  public constructor(private p: Parser) {}

  public parse(parent: AstNode, expectedLevel: number): SectionNode {
    // @TODO verify token is EQUALS
    const level = this.p.current.literal.length;
    if (level !== expectedLevel) {
      this.p.error(`expected heading level ${expectedLevel}, got ${level}`);
    }

    const section = new SectionNode(parent, 999);
    // @TODO lol
    return section;
  }
}
